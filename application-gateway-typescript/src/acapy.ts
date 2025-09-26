// src/acapy.ts
import axios, { AxiosInstance } from 'axios';

export type PeerId = string;

export interface AcapyConfig {
  baseUrl: string;        // Admin URL, e.g. "http://localhost:8051"
  apiKey?: string;        // if you set ADMIN_API_KEY on the agent
  role?: string | string[]; // "issuer" | "holder" | "verifier" | custom
  timeoutMs?: number;
}

// Read once at startup, supports any number of agents.
function loadAgents(): Record<PeerId, AcapyConfig> {
  // Preferred: a single JSON env with all agents
  // Example:
  // ACAPY_AGENTS='[
  //   {"peer":"1","baseUrl":"http://localhost:8051","role":"issuer"},
  //   {"peer":"2","baseUrl":"http://localhost:8061","role":"holder"},
  //   {"peer":"3","baseUrl":"http://localhost:8071","role":"verifier"},
  //   {"peer":"4","baseUrl":"http://localhost:8081","role":["holder","verifier"]}
  // ]'
  const raw = process.env.ACAPY_AGENTS;
  if (raw) {
    const arr = JSON.parse(raw) as Array<AcapyConfig & { peer: string }>;
    return Object.fromEntries(
      arr.map(({ peer, ...cfg }) => [peer, cfg])
    );
  }

  // Fallback to legacy 1/2/3 so you don’t break dev
  return {
    '1': { baseUrl: process.env.ACAPY_ISSUER_URL   || 'http://localhost:8051',  apiKey: process.env.ACAPY_ISSUER_KEY,   role: 'issuer',   timeoutMs: 15000 },
    '2': { baseUrl: process.env.ACAPY_HOLDER_URL   || 'http://localhost:8061',  apiKey: process.env.ACAPY_HOLDER_KEY,   role: 'holder',   timeoutMs: 15000 },
    '3': { baseUrl: process.env.ACAPY_VERIFIER_URL || 'http://localhost:8071',  apiKey: process.env.ACAPY_VERIFIER_KEY, role: 'verifier', timeoutMs: 15000 },
  };
}

const REGISTRY: Record<PeerId, AcapyConfig> = loadAgents();

export function getAgentConfig(peer: PeerId): AcapyConfig {
  const cfg = REGISTRY[peer];
  if (!cfg) throw Object.assign(new Error(`Unknown peer '${peer}'`), { status: 400 });
  return cfg;
}

export function clientFor(peer: PeerId): AxiosInstance {
  const cfg = getAgentConfig(peer);
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (cfg.apiKey) headers['X-API-Key'] = cfg.apiKey;
  return axios.create({ baseURL: cfg.baseUrl, timeout: cfg.timeoutMs ?? 15000, headers });
}

// Optional helper for role checks
export function hasRole(peer: PeerId, needed: string): boolean {
  const r = getAgentConfig(peer).role;
  return Array.isArray(r) ? r.includes(needed) : r === needed;
}

// …keep your ACA-Py wrapper functions the same, but accept `peer: string` …


// ---- DID management ----
export async function ensureDidKey(
  peer: PeerId,
  opts?: { forceNew?: boolean; key_type?: 'bls12381g2' | 'ed25519' }
) {
  const c = clientFor(peer);
  const forceNew = !!opts?.forceNew;
  const keyType  = opts?.key_type ?? 'bls12381g2';

  // If not forcing a new DID, try to return the existing public DID
  if (!forceNew) {
    try {
      const { data } = await c.get('/wallet/did/public');
      if (data?.result?.did) return data.result.did as string;
    } catch { /* ignore */ }
  }

  // Create did:key (new if forceNew=true, or first time)
  const { data: created } = await c.post('/wallet/did/create', {
    method: 'key',
    options: { key_type: keyType }
  });
  const did = created?.result?.did;
  if (!did) throw new Error('ACA-Py: failed to create DID');

  // Set it as public
  await c.post(`/wallet/did/public?did=${encodeURIComponent(did)}`);
  return did as string;
}

export async function getPublicDid(peer: PeerId) {
  const c = clientFor(peer);
  const { data } = await c.get('/wallet/did/public');
  return data?.result?.did || null;
}


// ---- Connections / OOB ----
export async function createInvitation(peer: PeerId, alias = 'oob', autoAccept = true) {
  const c = clientFor(peer);
  const { data } = await c.post(`/out-of-band/create-invitation${autoAccept ? '?auto_accept=true' : ''}`, {
    alias,
    handshake_protocols: ['https://didcomm.org/didexchange/1.0'],
    protocol_version: '2.0'
  });
  return data; // contains invitation + record
}



export async function receiveInvitation(peer: PeerId, invitation: any, alias?: string) {
  const c = clientFor(peer);
  // Construct the URL with alias as a query param if provided
  let url = '/out-of-band/receive-invitation';
  if (alias) {
    url += `?alias=${encodeURIComponent(alias)}`;
  }
  const { data } = await c.post(url, invitation);
  return data;
}





export async function listConnections(peer: PeerId, limit = 100, offset = 0) {
  const c = clientFor(peer);
  const { data } = await c.get(`/connections?limit=${limit}&offset=${offset}`);
  return data?.results ?? [];
}

// ---- Issue credential (W3C LD) ----
export async function issueCredentialLd(peer: PeerId, connection_id: string, credential: any, proofType = 'BbsBlsSignature2020') {
  const c = clientFor(peer);
  const payload = {
    auto_remove: false,
    connection_id,
    filter: { ld_proof: { credential, options: { proofType } } }
  };
  const { data } = await c.post('/issue-credential-2.0/send', payload);
  return data;
}

// ---- Verifier: request presentation (DIF PE) ----
export async function requestPresentation(peer: PeerId, connection_id: string, presDef: any, opts?: { challenge?: string; domain?: string; auto_verify?: boolean }) {
  const c = clientFor(peer);
  const payload = {
    auto_remove: false,
    auto_verify: opts?.auto_verify ?? true,
    connection_id,
    presentation_request: {
      dif: {
        options: { challenge: opts?.challenge || cryptoRand(), domain: opts?.domain || 'example.org' },
        presentation_definition: presDef
      }
    }
  };
  const { data } = await c.post('/present-proof-2.0/send-request', payload);
  return data;
}

// ---- Records helpers ----
export async function listCredEx(peer: PeerId) {
  const c = clientFor(peer);
  const { data } = await c.get('/issue-credential-2.0/records');
  return data?.results ?? [];
}
export async function listProofEx(peer: PeerId) {
  const c = clientFor(peer);
  const { data } = await c.get('/present-proof-2.0/records');
  return data?.results ?? [];
}

// ---- tiny util ----
function cryptoRand() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = (Math.random()*16)|0, v = c === 'x' ? r : (r&0x3|0x8);
    return v.toString(16);
  });
}

export async function sendPresentation(
  peer: PeerId,
  pres_ex_id: string,
  record_ids: string[],
  opts?: { challenge?: string; domain?: string }
) {
  const c = clientFor(peer);
  const payload = {
    dif: {
      record_ids: record_ids || [],
      options: {
        challenge: opts?.challenge || cryptoRand(),
        domain:    opts?.domain    || 'example.org'
      }
    }
  };
  const { data } = await c.post(
    `/present-proof-2.0/records/${encodeURIComponent(pres_ex_id)}/send-presentation`,
    payload
  );
  return data;
}

