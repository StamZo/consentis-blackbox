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
export function clientForReq(req: any, peer: PeerId) {
  const baseUrl = getAgentConfig(peer).baseUrl;
  const headers: any = { 'Content-Type': 'application/json' };

  // pass through the tenant token from the caller
  const bearer = req.headers?.authorization;
  if (bearer) headers.Authorization = bearer;

  return axios.create({ baseURL: baseUrl, headers });
}


// Optional helper for role checks
export function hasRole(peer: PeerId, needed: string): boolean {
  const r = getAgentConfig(peer).role;
  return Array.isArray(r) ? r.includes(needed) : r === needed;
}

// …keep your ACA-Py wrapper functions the same, but accept `peer: string` …


// ---- DID management ----
export async function ensureDidKey(
  req: any,
  peer: PeerId,
  opts?: {
    forceNew?: boolean;
    key_type?: 'bls12381g2' | 'ed25519';
    setPublic?: boolean;
  }
): Promise<{ did: string; verkey?: string }> {
  const c = clientForReq(req, peer);
  const forceNew = !!opts?.forceNew;
  const keyType  = opts?.key_type ?? 'ed25519';
  const setPublic = opts?.setPublic ?? false;

  // If we want a public DID and not forcing new, reuse existing public DID
  if (setPublic && !forceNew) {
    try {
      const { data } = await c.get('/wallet/did/public');
      const did = data?.result?.did;
      if (did) return { did, verkey: data?.result?.verkey };
    } catch { /* ignore */ }
  }

  // Create did:key
  const { data: created } = await c.post('/wallet/did/create', {
    method: 'key',
    options: { key_type: keyType },
  });

  const did = created?.result?.did;
  if (!did) throw new Error('ACA-Py: failed to create DID');

  if (setPublic) {
    await c.post(`/wallet/did/public?did=${encodeURIComponent(did)}`);
  }

  return { did, verkey: created?.result?.verkey };
}

export async function ensurePublicFabricDid(
  req: any,
  peer: PeerId,
  didFabric: string
): Promise<{ did: string; verkey?: string }> {
  const c = clientForReq(req, peer);

  // If already public and matches, reuse
  try {
    const { data } = await c.get('/wallet/did/public');
    if (data?.result?.did === didFabric) {
      return { did: didFabric, verkey: data?.result?.verkey };
    }
  } catch { /* ignore */ }

  // Create did:fabric with ed25519 key
  const { data: created } = await c.post('/wallet/did/create', {
    method: 'fabric',
    options: {
      did: didFabric,
      key_type: 'ed25519',
    },
  });

  const did = created?.result?.did;
  if (did !== didFabric) throw new Error(`ACA-Py: did:fabric create mismatch: ${did} != ${didFabric}`);

  // Make it public
  await c.post(`/wallet/did/public?did=${encodeURIComponent(didFabric)}`);

  return { did: didFabric, verkey: created?.result?.verkey };
}

export async function getPublicDid(req: any, peer: PeerId) {
  const c = clientForReq(req, peer);
  const { data } = await c.get('/wallet/did/public');
  return data?.result?.did || null;
}




type WalletDidRecord = {
  did: string;
  verkey?: string;
  posture?: string;   // "posted" | "wallet_only" | ...
  key_type?: string;  // "bls12381g2" | "ed25519" | ...
  method?: string;    // "key" | "fabric" | ...
  metadata?: any;
  created_at?: string;
  updated_at?: string;
};

/**
 * Return the most recently-created BLS did:key from the agent wallet.
 *
 * "Latest" strategy:
 * 1) If records have created_at/updated_at, sort by those.
 * 2) Otherwise, rely on ACA-Py's returned order and take the last match.
 *
 * Preference:
 * - If any BLS did:key is posture=posted, pick among those first.
 * - Else pick among wallet_only.
 */
export async function getLatestBlsDid(c: AxiosInstance): Promise<string | null> {
  const { data } = await c.get("/wallet/did");
  const results: WalletDidRecord[] = Array.isArray(data?.results) ? data.results : [];

  // keep only did:key + bls12381g2
  const bls = results.filter((r) => {
    const did = String(r?.did || "");
    const keyType = String(r?.key_type || "").toLowerCase();
    const method = String(r?.method || "").toLowerCase();
    return did.startsWith("did:key:") && keyType === "bls12381g2" && (method === "" || method === "key");
  });

  if (!bls.length) return null;

  // prefer posted (if any exist)
  const posted = bls.filter((r) => String(r?.posture || "").toLowerCase() === "posted");
  const candidates = posted.length ? posted : bls;

  // if timestamps exist, sort by them
  const withTime = candidates.some((r) => r?.updated_at || r?.created_at);
  if (withTime) {
    candidates.sort((a, b) => {
      const ta = Date.parse(String(a.updated_at || a.created_at || "")) || 0;
      const tb = Date.parse(String(b.updated_at || b.created_at || "")) || 0;
      return ta - tb;
    });
  }

  // "latest" = last record after sorting (or last in returned order)
  return candidates[candidates.length - 1].did;
}


// ---- Connections / DID exchange ----
export async function connectToPublicDid(
  req: any,
  peer: PeerId,
  their_public_did: string,
  opts?: { alias?: string; auto_accept?: boolean; protocol?: 'didexchange/1.0' | 'didexchange/1.1'; service_accept?: string[] }
) {
  const c = clientForReq(req, peer);
  const params: any = {
    their_public_did,
    alias: opts?.alias,
    auto_accept: opts?.auto_accept ?? true,
    protocol: opts?.protocol ?? 'didexchange/1.1',
  };
  if (opts?.service_accept?.length) params.service_accept = opts.service_accept; // axios will repeat it

  const { data } = await c.post('/didexchange/create-request', undefined, { params });
  return data;
}



// ---- Connections / OOB ----
// export async function createInvitation(req: any, peer: PeerId, alias = 'oob', autoAccept = true) {
//   const c = clientForReq(req, peer);
//   const { data } = await c.post(`/out-of-band/create-invitation${autoAccept ? '?auto_accept=true' : ''}`, {
//     alias,
//     handshake_protocols: ['https://didcomm.org/didexchange/1.0'],
//     protocol_version: '2.0'
//   });
//   return data; // contains invitation + record
// }
export async function createInvitation(req: any, peer: PeerId, alias: string, autoAccept = true) {
  const c = clientForReq(req, peer);
  const payload: any = {
    alias,
    handshake_protocols: ['https://didcomm.org/didexchange/1.0'],
    // NEW: let counterparty negotiate DIDComm v2 or fall back to AIP2
    accept: ['didcomm/v2', 'didcomm/aip2;env=rfc19'],
    // optional; keep only if your build supports it
    protocol_version: '2.0',
  };
  const { data } = await c.post(
    `/out-of-band/create-invitation${autoAccept ? '?auto_accept=true' : ''}`,
    payload
  );
  return data; // ACA-Py returns record + invitation(+ invitation_url)
}




// export async function receiveInvitation(req: any, peer: PeerId, invitation: any, alias?: string) {
//   const c = clientForReq(req, peer);
//   // Construct the URL with alias as a query param if provided
//   let url = '/out-of-band/receive-invitation';
//   if (alias) {
//     url += `?alias=${encodeURIComponent(alias)}`;
//   }
//   const { data } = await c.post(url, invitation);
//   return data;
// }

export async function receiveInvitation(req: any, peer: PeerId, invitation: any, alias: string) {
  const c = clientForReq(req, peer);
  let url = '/out-of-band/receive-invitation?use_existing_connection=true';
  if (alias) url += `&alias=${encodeURIComponent(alias)}`;
  const { data } = await c.post(url, invitation);
  return data;
}



export async function deleteConnectionById(
  req: any,
  peer: PeerId,
  connectionId: string
) {
  const c = clientForReq(req, peer);
  const { data } = await c.delete(`/connections/${connectionId}`);
  // ACA-Py often returns {}, so normalize:
  return data ?? { deleted: true, connection_id: connectionId };
}


export async function deleteConnectionsByAlias(
  req: any,
  peer: PeerId,
  alias: string,
  opts?: { state?: string }
) {
  const c = clientForReq(req, peer);

  const qp: string[] = [];
  if (alias) qp.push(`alias=${encodeURIComponent(alias)}`);
  if (opts?.state) qp.push(`state=${encodeURIComponent(opts.state)}`);
  const query = qp.length ? `?${qp.join('&')}` : '';

  const { data } = await c.get(`/connections${query}`);
  const results: any[] = data?.results ?? [];

  const deleted: string[] = [];
  for (const conn of results) {
    const id = conn.connection_id;
    if (!id) continue;
    await c.delete(`/connections/${id}`);
    deleted.push(id);
  }

  return {
    alias,
    state: opts?.state ?? null,
    count: deleted.length,
    deleted,
  };
}


// export async function listConnections(req: any, peer: PeerId, limit = 100, offset = 0) {
//   const c = clientForReq(req, peer);
//   const { data } = await c.get(`/connections?limit=${limit}&offset=${offset}`);
//   return data?.results ?? [];
// }

export async function listConnections(
  req: any,
  peer: PeerId,
  limit = 100,
  offset = 0,
  client?: any          // <-- NEW optional client
) {
  const c = client ?? clientForReq(req, peer);
  const { data } = await c.get(`/connections?limit=${limit}&offset=${offset}`);
  return data?.results ?? [];
}

// ---- Issue credential (W3C LD) ----
export async function issueCredentialLd(req: any, peer: PeerId, connection_id: string, credential: any, proofType = 'BbsBlsSignature2020') {
  const c = clientForReq(req, peer);
  const issuerDid = credential?.issuer?.id || credential?.issuer;
  const verificationMethod = `${issuerDid}#bbs-1`; 
  const payload = {
    auto_remove: false,
    connection_id,
    filter: { ld_proof: { credential, options: { proofType,  verificationMethod, } } }
  };
  const { data } = await c.post('/issue-credential-2.0/send', payload);
  return data;
}



export interface W3cCredentialRecord {
  id?: string;
  [key: string]: any;
}

export async function fetchW3cCredentials(
  req: any,
  peer: PeerId,
  credentialId?: string
): Promise<{ single?: W3cCredentialRecord; list?: W3cCredentialRecord[] }> {
  const c = clientForReq(req, peer);

  if (credentialId) {
    // Single credential
    const { data } = await c.get(`/credential/w3c/${credentialId}`);
    return { single: data };
  } else {
    // List all
    const { data } = await c.post('/credentials/w3c');
    return { list: data?.results ?? [] };
  }
}

function unwrapAxiosError(e: any): never {
  if (e.response) {
    console.error(
      'ACA-Py error',
      e.response.status,
      JSON.stringify(e.response.data, null, 2)
    );
  } else {
    console.error('ACA-Py error (no response)', e.message);
  }
  throw e;
}

// List all JSON-LD (W3C) credentials in the tenant wallet
export async function listW3cCredentials(req: any, peer: PeerId) {
  const c = clientForReq(req, peer);

  try {
    const { data } = await c.post('/credentials/w3c', {});
    const records: any[] = data?.results ?? [];

    // expose record_id as id and spread the VC
    return records.map((r) => ({
      id: r.record_id,
      record_id: r.record_id,   // keep both if you want
      ...r.cred_value,          // @context, type, issuer, credentialSubject, proof
    }));
  } catch (e) {
    unwrapAxiosError(e);
  }
}


// Get a single JSON-LD credential by record_id
export async function getW3cCredential(req: any, peer: PeerId, id: string) {
  const c = clientForReq(req, peer);

  // Either keep your existing /credentials/w3c/{id}…
  // const { data } = await c.get(`/credentials/w3c/${id}`);

  // …or use VC-API detail endpoint (cleaner & future-proof):
  const { data } = await c.get(`/vc/credentials/${id}`);

  return { credential_id: id, credential: data };
}



// ---- Verifier: request presentation (DIF PE) ----
export async function requestPresentation(req: any, peer: PeerId, connection_id: string, presDef: any, opts?: { challenge?: string; domain?: string; auto_verify?: boolean }) {
  const c = clientForReq(req, peer);
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
export async function listCredEx(req: any, peer: PeerId) {
  const c = clientForReq(req, peer);
  const { data } = await c.get('/issue-credential-2.0/records');
  return data?.results ?? [];
}
export async function listProofEx(req: any, peer: PeerId) {
  const c = clientForReq(req, peer);
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
  req: any,
  peer: PeerId,
  pres_ex_id: string,
  record_ids: string[],
  opts?: { challenge?: string; domain?: string }
) {
  const c = clientForReq(req, peer);
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



