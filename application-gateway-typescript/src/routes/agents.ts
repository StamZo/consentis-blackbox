// src/routes/agent.ts
import { Router } from 'express';
import axios from 'axios';
import {
  clientFor, getAgentConfig, hasRole,
  ensureDidKey, getPublicDid,
  createInvitation, receiveInvitation,
  listConnections, issueCredentialLd,
  requestPresentation, listCredEx, listProofEx,PeerId,sendPresentation
} from '../acapy';
import * as crypto from 'crypto';


const router = Router();

type CredCandidate = { record_id?: string; issuanceDate?: string; __created?: string };

function peerFromReq(req: any): string {
  const peer = String(req.userPayload?.selected_peer || '');
  if (!peer) throw Object.assign(new Error('selected_peer missing'), { status: 400 });
  // Optionally validate that peer exists:
  getAgentConfig(peer); // throws 400 if unknown
  return peer;
}

// Role guards (capability based)
function requireRole(peer: string, role: string) {
  if (!hasRole(peer, role)) {
    throw Object.assign(new Error(`Operation requires role: ${role}`), { status: 403 });
  }
}

// DID bootstrap (any peer or guard if you want)
// router.post('/did/bootstrap', async (req: any, res, next) => {
//   try {
//     const peer = peerFromReq(req);
//     const did = await ensureDidKey(peer);
//     const pub = await getPublicDid(peer);
//     res.json({ peer, did: pub ?? did });
//   } catch (e) { next(e); }
// });
// DID bootstrap (+ optional persist to Fabric)
router.post('/did/bootstrap', async (req: any, res, next) => {
  try {
    const peer = peerFromReq(req);

    // NEW: allow forcing a fresh DID via { "new": true } and optional { "keyType": "ed25519" }
    const forceNew: boolean = !!req.body?.new;
    const keyType = req.body?.keyType as ('bls12381g2' | 'ed25519') | undefined;

    const did = await ensureDidKey(peer, { forceNew, key_type: keyType });
    const pub = await getPublicDid(peer);
    const didToStore = pub ?? did;

    // auto-persist for issuer, or when caller asks explicitly
    const persist = Boolean(req.body?.persist) || hasRole(peer, 'issuer');

    let stored = false;
    let storeResult: any = undefined;

    if (persist) {
      const base = `${req.protocol}://${req.get('host')}`;
      const url = `${base}/storeDIDkey/${encodeURIComponent(didToStore)}`;

      try {
        const { data } = await axios.post(url, undefined, {
          headers: { authorization: String(req.headers.authorization || '') }
        });
        stored = true;
        storeResult = data;
      } catch (e: any) {
        const msg = e?.response?.data?.error || e?.message || '';
        if (/already exists|exists/i.test(msg)) {
          stored = true;
        } else {
          throw e;
        }
      }
    }

    res.json({ peer, did: didToStore, new: forceNew, keyType: keyType ?? 'bls12381g2', stored, storeResult });
  } catch (e) { next(e); }
});


// Invitations
router.post('/invitations/create', async (req: any, res, next) => {
  try {
    const peer = peerFromReq(req);                  // typically issuer or verifier
    const { alias = 'oob', autoAccept = true } = req.body || {};
    const inv = await createInvitation(peer, alias, !!autoAccept);
    res.json({ peer, ...inv });
  } catch (e) { next(e); }
});

router.post('/invitations/accept', async (req, res, next) => {
  try {
    const peer = peerFromReq(req);  // holder agent peer
    const { invitation, alias } = req.body || {};
    if (!invitation) {
      return res.status(400).json({ error: 'invitation required' });
    }
    const out = await receiveInvitation(peer, invitation, alias);
    res.json({ peer, ...out });
  } catch (e) {
    next(e);
  }
});


// src/routes/agents.ts




// Connections
router.get('/connections', async (req: any, res, next) => {
  try {
    const peer = peerFromReq(req);
    const list = await listConnections(peer);
    res.json({ peer, results: list });
  } catch (e) { next(e); }
});

// router.get('/connections', async (req: any, res, next) => {
//   try {
//     const peer = peerFromReq(req);
//     const list = await listConnections(peer);

//     // Add a friendly alias field (fallback to their_label when alias is missing)
//     const results = (list || []).map((c: any) => ({
//       ...c,
//       alias: c?.alias ?? c?.their_label ?? null,
//     }));

//     res.json({ peer, results });
//   } catch (e) {
//     next(e);
//   }
// });


async function connectionIdFromAlias(peer: PeerId, alias: string): Promise<string> {
  const c = clientFor(peer);
  const { data } = await c.get('/connections', { params: { alias, state: 'active' } });
  const list = data?.results || [];
  if (!list.length) throw Object.assign(new Error(`No active connection with alias "${alias}"`), { status: 404 });
  // pick the most recently updated/created
  list.sort((a: any, b: any) => new Date(b.updated_at || b.created_at || 0).getTime() - new Date(a.updated_at || a.created_at || 0).getTime());
  return list[0].connection_id;
}
// Issue credential (role gated)


router.post('/credentials/issue', async (req: any, res, next) => {
  try {
    const peer = peerFromReq(req);
    requireRole(peer, 'issuer');

    const { alias, holderDid, consentId, issuerDid, proofType = 'BbsBlsSignature2020' } = req.body || {};
    if (!alias || !holderDid || !consentId) {
      return res.status(400).json({ error: 'alias, holderDid and consentId are required' });
    }

    // 1) resolve alias -> connection_id
    const connection_id = await connectionIdFromAlias(peer, alias);

    // 2) pick issuer DID (use provided, else latest public or ensure one)
    const issuer =
      issuerDid ||
      (await getPublicDid(peer)) ||
      (await ensureDidKey(peer));

    // 3) build a minimal, consistent LD credential
    const credential = {
      '@context': [
        'https://www.w3.org/2018/credentials/v1',
        'https://w3id.org/security/bbs/v1',
        { '@vocab': 'https://example.com/vocab#' }
      ],
      type: ['VerifiableCredential', 'EmployeeCredential'],
      issuer,
      issuanceDate: new Date().toISOString(),
      credentialSubject: {
        id: holderDid,
        consentId
      }
    };

    // 4) issue (re-using your existing function)
    const out = await issueCredentialLd(peer, connection_id, credential, proofType);
    res.json({ peer, issued: true, connection_id, issuer, result: out });
  } catch (e) { next(e); }
});



// Proof request (role gated)


// Ensure the PD has a consentId field with the requested purpose text
function ensureConsentPurpose(presDef: any, purposeText: string, nameText?: string) {
  const PD = { ...(presDef || {}) };
  PD.id = PD.id || crypto.randomUUID?.() || String(Date.now());
  PD.format = PD.format || { ldp_vp: { proof_type: ['BbsBlsSignature2020'] } };
  PD.input_descriptors = PD.input_descriptors || [{
    id: 'consent_vc',
    name: nameText || 'Consent Credential',
    schema: [{ uri: 'https://www.w3.org/2018/credentials#VerifiableCredential' }],
    constraints: { limit_disclosure: 'required', fields: [] }
  }];

  const d0 = PD.input_descriptors[0];
  d0.id = d0.id || 'consent_vc';
  d0.name = d0.name || nameText || 'Consent Credential';
  d0.constraints = d0.constraints || {};
  d0.constraints.fields = d0.constraints.fields || [];

  const path = '$.credentialSubject.consentId';
  const f = d0.constraints.fields.find((x: any) => Array.isArray(x?.path) && x.path.includes(path));
  if (f) {
    if (!f.purpose) f.purpose = purposeText;
  } else {
    d0.constraints.fields.push({ path: [path], purpose: purposeText });
  }
  return PD;
}


router.post('/proofs/request', async (req: any, res, next) => {
  try {
    const peer = peerFromReq(req);
    requireRole(peer, 'verifier');

    const {
      alias,
      purpose = 'We need to check consent validity',
      name = `Consent check for ${alias}`, // optional human-readable name
      presentation_definition,
      options
    } = req.body || {};

    if (!alias) return res.status(400).json({ error: 'alias is required' });

    const connection_id = await connectionIdFromAlias(peer, alias);

    // include name in PD construction
    const presDef = ensureConsentPurpose(presentation_definition, purpose, name);

    const out = await requestPresentation(peer, connection_id, presDef, options);
    res.json({ peer, connection_id, requested: true, result: out });
  } catch (e) { next(e); }
});

// Holder: send presentation



function pickRecordIds(cands: CredCandidate[]): string[] {
  if (!Array.isArray(cands) || cands.length === 0) return [];
  const sorted = [...cands].sort((a, b) => {
    const ai = Date.parse(a.issuanceDate || '') || 0;
    const bi = Date.parse(b.issuanceDate || '') || 0;
    if (ai !== bi) return bi - ai;
    const ac = Date.parse(a.__created || '') || 0;
    const bc = Date.parse(b.__created || '') || 0;
    return bc - ac;
  });
  const first = sorted.find(x => x.record_id);
  return first?.record_id ? [first.record_id] : [];
}





// Holder inbox: show only request-received proof records (optionally filter by connection_id)


router.get('/proofs/inbox', async (req: any, res, next) => {
  try {
    const peer = peerFromReq(req);
    requireRole(peer, 'holder');

    const base = getAgentConfig(peer).baseUrl;

    // NEW: map connection_id -> alias (fallback to their_label)
    const conns = await listConnections(peer);
    const aliasByConn: Record<string, string | null> = {};
    for (const c of conns || []) {
      const id = c?.connection_id;
      if (id) aliasByConn[id] = c?.alias ?? c?.their_label ?? null;
    }

    // 1) Get all proof records
    const { data } = await axios.get(`${base}/present-proof-2.0/records`);
    const records = (data?.results || []).filter((r: any) => r.state === 'request-received');

    const results: any[] = [];
    for (const r of records) {
      // normalize id across Aca-Py versions
      const pres_ex_id = r.pres_ex_id || r.presentation_exchange_id || r._id;

      // 2) Query candidate credentials for this proof exchange
      const { data: cands } = await axios.get(
        `${base}/present-proof-2.0/records/${encodeURIComponent(pres_ex_id)}/credentials`
      );

      const norm = (cands || []).map((c: any) => ({
        record_id: c.record_id,
        issuanceDate: c.issuanceDate,
        __created: c.proof?.created,
      }));

      const suggested = norm.length === 1 ? [norm[0].record_id] : pickRecordIds(norm);

      // 3) Extract DIF options (challenge/domain) from the proof request
      const difOptions =
        r?.by_format?.pres_request?.dif?.options
        || r?.pres_request?.dif?.options
        || r?.presentation_request_dict?.dif?.options
        || {};

      const challenge = difOptions.challenge ?? null;
      const domain    = difOptions.domain ?? null;

      const connection_id = r.connection_id;
      const alias = aliasByConn[connection_id] ?? null; // <-- added

      results.push({
        pres_ex_id,
        connection_id,
        alias,                       // <-- added
        thread_id: r.thread_id,
        state: r.state,
        role: r.role,
        requested:
          r?.by_format?.pres_request?.dif?.presentation_definition?.input_descriptors || [],
        suggested_record_ids: suggested,
        challenge,
        domain,
      });
    }

    res.json({ peer, total: results.length, results });
  } catch (e) {
    next(e);
  }
});




// POST /agent/proofs/send

router.post('/proofs/send', async (req: any, res, next) => {
  try {
    const peer = peerFromReq(req);
    requireRole(peer, 'holder');

    const base = getAgentConfig(peer).baseUrl;
    const body = req.body || {};

    // pres_ex_id optional; if absent we’ll use the latest request-received
    let pres_ex_id: string | undefined = body.pres_ex_id;
    const consentId: string | undefined = body.consentId;

    // If nothing provided, fall back to the latest request-received
    if (!pres_ex_id) {
      const { data } = await axios.get(`${base}/present-proof-2.0/records`);
      const reqs: any[] = (data?.results || []).filter((r: any) => r.state === 'request-received');
      if (reqs.length === 0) return res.status(404).json({ error: 'No pending proof requests' });

      const latest = reqs.sort((a, b) =>
        new Date(b?.updated_at || b?.created_at || 0).getTime() -
        new Date(a?.updated_at || a?.created_at || 0).getTime()
      )[0];

      pres_ex_id = latest.pres_ex_id || latest.presentation_exchange_id || latest._id;
    }

    // 1) Read the proof record to know the input_descriptor ids
    let descriptorIds: string[] = [];
    try {
      const { data: rec } = await axios.get(
        `${base}/present-proof-2.0/records/${encodeURIComponent(pres_ex_id!)}`
      );
      const defs =
        rec?.by_format?.pres_request?.dif?.presentation_definition?.input_descriptors ||
        rec?.pres_request?.dif?.presentation_definition?.input_descriptors ||
        rec?.presentation_request_dict?.dif?.presentation_definition?.input_descriptors ||
        [];
      descriptorIds = defs.map((d: any) => d?.id).filter(Boolean);
    } catch { /* non-fatal */ }

    // 2) Fetch candidates for this exchange
    const { data: cands } = await axios.get(
      `${base}/present-proof-2.0/records/${encodeURIComponent(pres_ex_id!)}/credentials`
    );

    // 3) Normalize (keep the raw candidate so we can inspect multiple shapes)
    type Candidate = {
      record_id?: string;
      issuanceDate?: string;
      __created?: string;
      raw?: any;
    };
    const norm: Candidate[] = (cands || []).map((c: any) => ({
      record_id: c?.record_id,
      issuanceDate: c?.issuanceDate,
      __created: c?.proof?.created,
      raw: c
    }));

    // 4) Helper to read consentId from several possible shapes
    const getConsentId = (x: any): string | undefined => {
      if (!x || typeof x !== 'object') return undefined;
      if (x.credentialSubject?.consentId) return String(x.credentialSubject.consentId);                    // top-level VC (your case)
      if (x.cred_value?.credentialSubject?.consentId) return String(x.cred_value.credentialSubject.consentId);
      if (x.credential?.credentialSubject?.consentId) return String(x.credential.credentialSubject.consentId);
      if (x.attrs?.consentId) return String(x.attrs.consentId);                                           // name/value map
      return undefined;
    };

    // 5) Filter by consentId (if provided). Otherwise, keep all.
    let filtered = norm;
    if (consentId) {
      filtered = norm.filter(n => getConsentId(n.raw) === String(consentId));
      if (filtered.length === 0) {
        return res.status(404).json({
          error: 'no_matching_credentials_for_consentId',
          message: `No credential in wallet has credentialSubject.consentId="${consentId}".`
        });
      }
    }

    // 6) Pick one record_id (newest issuance first; fall back to created)
    const pickedIds = filtered.length === 1 ? [filtered[0].record_id!] : pickRecordIds(filtered as any);
    if (!pickedIds || pickedIds.length === 0) {
      return res.status(422).json({ error: 'No suitable credentials found for this proof request' });
    }

    // 7) Build DIF payload:
    //    Prefer descriptor-keyed mapping when we know the descriptor id.
    let difPayload: any;
    if (descriptorIds.length === 1) {
      difPayload = { record_ids: { [descriptorIds[0]]: pickedIds } };
    } else if (descriptorIds.length > 1) {
      return res.status(400).json({
        error: 'record_ids_required_for_multiple_descriptors',
        message: 'Multiple input_descriptors present; provide record_ids as { descriptorId: [ids] }.'
      });
    } else {
      // Some deployments accept the simple array for single-descriptor PDs
      difPayload = { record_ids: pickedIds };
    }

    // Do NOT include options (challenge/domain). ACA-Py already has them on the exchange.
    const payload = { dif: difPayload };

    const { data: sent } = await axios.post(
      `${base}/present-proof-2.0/records/${encodeURIComponent(pres_ex_id!)}/send-presentation`,
      payload
    );

    return res.json({
      peer,
      pres_ex_id,
      used_descriptor_id: descriptorIds[0] ?? null,
      used_record_id: pickedIds[0],
      used_consentId: consentId ?? null,
      result: sent
    });
  } catch (e: any) {
    const status = e?.response?.status || 500;
    const details = e?.response?.data || e?.message || 'ACA-Py error';
    return res.status(status).json({ error: 'ACA-Py error', status, details });
  }
});




// helper: extract consentId across ACA-Py candidate shapes
// function extractConsentId(candidate: any): string | undefined {
//   try {
//     // Common LD shapes
//     if (candidate?.credential?.credentialSubject?.consentId) {
//       return String(candidate.credential.credentialSubject.consentId);
//     }
//     if (candidate?.cred?.credentialSubject?.consentId) {
//       return String(candidate.cred.credentialSubject.consentId);
//     }
//     if (candidate?.vc?.credentialSubject?.consentId) {
//       return String(candidate.vc.credentialSubject.consentId);
//     }
//     // What /credentials/w3c shows
//     if (candidate?.cred_value?.credentialSubject?.consentId) {
//       return String(candidate.cred_value.credentialSubject.consentId);
//     }
//     // Indy-like / attrs bags
//     if (candidate?.cred_info?.attrs?.consentId) {
//       return String(candidate.cred_info.attrs.consentId);
//     }
//     if (candidate?.attrs?.consentId) {
//       return String(candidate.attrs.consentId);
//     }
//     // Flat fallback
//     if (candidate?.credentialSubject?.consentId) {
//       return String(candidate.credentialSubject.consentId);
//     }
//   } catch {}
//   return undefined;
// }



// List verifier proof exchanges (optionally filter by state)


// helper that hunts consentId across ACA-Py shapes
function extractConsentIdAny(rec: any): string | null {
  // by_format DIF (two common variants)
  const a =
    rec?.by_format?.pres?.dif?.verifiablePresentation?.verifiableCredential?.[0]?.credentialSubject?.consentId
    ?? rec?.by_format?.pres?.dif?.presentation?.verifiableCredential?.[0]?.credentialSubject?.consentId;

  if (typeof a === 'string' && a.length) return a;

  // raw DIDComm attachment (presentations~attach → data.json → verifiableCredential[])
  const b =
    rec?.pres?.['presentations~attach']?.[0]?.data?.json?.verifiableCredential?.[0]?.credentialSubject?.consentId
    ?? rec?.presentation?.['presentations~attach']?.[0]?.data?.json?.verifiableCredential?.[0]?.credentialSubject?.consentId;

  if (typeof b === 'string' && b.length) return b;

  return null;
}


router.get('/proofs/records', async (req: any, res, next) => {
  try {
    const peer = peerFromReq(req);
    requireRole(peer, 'verifier');

    const { state } = req.query as { state?: string };
    const records = await listProofEx(peer);
    const filtered = state ? records.filter((r: any) => r?.state === String(state)) : records;

    // build a map of connection_id -> alias (fallback to their_label)
    const conns = await listConnections(peer);
    const aliasByConn: Record<string, string | null> = {};
    for (const c of conns || []) {
      const id = c?.connection_id;
      if (id) aliasByConn[id] = c?.alias ?? c?.their_label ?? null;
    }

    const base = getAgentConfig(peer).baseUrl;

    const detailed = await Promise.all(
      filtered.map(async (r: any) => {
        // try to extract directly from list item first
        let consentId: string | null = extractConsentIdAny(r);

        // if not present, fetch record detail and try again
        if (!consentId) {
          const id = r.pres_ex_id || r.presentation_exchange_id || r._id;
          try {
            const { data: rec } = await axios.get(
              `${base}/present-proof-2.0/records/${encodeURIComponent(id)}`
            );
            consentId = extractConsentIdAny(rec);
          } catch {
            // ignore; leave as null
          }
        }

        const connection_id = r.connection_id;
        const alias = aliasByConn[connection_id] ?? null;

        return {
          pres_ex_id: r.pres_ex_id,
          connection_id,
          alias,                       
          thread_id: r.thread_id,
          state: r.state,
          role: r.role,
          verified: r.verified ?? r?.by_format?.pres?.dif?.verified ?? undefined,
          created_at: r.created_at,
          updated_at: r.updated_at,
          consentId,                  
        };
      })
    );

    res.json({ peer, total: detailed.length, results: detailed });
  } catch (e) {
    next(e);
  }
});




//verifier: verify presentation consent validity
// --- helpers to parse DIF presentation shapes (reuse your earlier helpers style) ---



function extractIssuerDidAny(rec: any): string | null {
  // by_format DIF
  const a =
    rec?.by_format?.pres?.dif?.verifiablePresentation?.verifiableCredential?.[0]?.issuer
    ?? rec?.by_format?.pres?.dif?.presentation?.verifiableCredential?.[0]?.issuer;
  if (typeof a === 'string' && a.length) return a;

  // raw DIDComm attachment
  const b =
    rec?.pres?.['presentations~attach']?.[0]?.data?.json?.verifiableCredential?.[0]?.issuer
    ?? rec?.presentation?.['presentations~attach']?.[0]?.data?.json?.verifiableCredential?.[0]?.issuer;
  if (typeof b === 'string' && b.length) return b;

  return null;
}

function extractVerifiedFlag(rec: any): boolean | undefined {
  // Aca-Py commonly sets one of these:
  if (typeof rec?.verified === 'boolean') return rec.verified;
  if (typeof rec?.verified === 'string') return rec.verified === 'true';
  const v = rec?.by_format?.pres?.dif?.verified;
  if (typeof v === 'boolean') return v;
  if (typeof v === 'string') return v === 'true';
  return undefined;
}

// Pick most recent record (updated_at or created_at)
function sortByRecency(a: any, b: any) {
  const ta = Date.parse(a?.updated_at || a?.created_at || 0);
  const tb = Date.parse(b?.updated_at || b?.created_at || 0);
  return tb - ta;
}

// --- POST /agent/proofs/verify ---
router.post('/proofs/verify', async (req: any, res, next) => {
  try {
    const peer = peerFromReq(req);
    requireRole(peer, 'verifier');

    const { consentId, purpose = 'treatment', operation = 'read' } = req.body || {};
    if (!consentId) return res.status(400).json({ error: 'consentId is required' });

    // 1) Find a completed/verified proof exchange that contains this consentId
    const records = await listProofEx(peer);
    const candidates = records
      .filter((r: any) => ['done', 'verified', 'presentation-received'].includes(String(r?.state || '')))
      .sort(sortByRecency);

    let matched: any | null = null;
    for (const r of candidates) {
      const cid = extractConsentIdAny(r);
      if (cid && String(cid) === String(consentId)) {
        matched = r;
        break;
      }
    }

    // if not found in the list view, try fetching details of the latest "done" records to double-check
    if (!matched) {
      const base = getAgentConfig(peer).baseUrl;
      for (const r of candidates.slice(0, 5)) {
        const id = r.pres_ex_id || r.presentation_exchange_id || r._id;
        try {
          const { data: rec } = await axios.get(`${base}/present-proof-2.0/records/${encodeURIComponent(id)}`);
          const cid = extractConsentIdAny(rec);
          if (cid && String(cid) === String(consentId)) {
            matched = rec;
            break;
          }
        } catch {/* ignore */}
      }
    }

    if (!matched) {
      return res.status(404).json({ error: 'vp_not_found_for_consentId', message: `No VP found for consentId "${consentId}".` });
    }

    const verified = extractVerifiedFlag(matched);
    if (!verified) {
      return res.status(409).json({ error: 'vp_not_verified', message: 'Presentation exists but is not verified=true.' });
    }

    // 2) Extract issuer DID from the VP and check it on-chain (revocation / existence)
    const issuerDid =
      extractIssuerDidAny(matched) ||
      null;

    if (!issuerDid) {
      return res.status(422).json({ error: 'issuer_missing', message: 'Issuer DID not present in VP.' });
    }

    // Call local /readDIDkey/:did (reuse auth header for verifyToken)
    const selfBase = `${req.protocol}://${req.get('host')}`;
    let didDoc: any = null;

    try {
      const { data } = await axios.get(
        `${selfBase}/readDIDkey/${encodeURIComponent(issuerDid)}`,
        { headers: { authorization: String(req.headers.authorization || '') } }
      );
      // Some environments may serialize as string; normalize to object
      didDoc = typeof data === 'string' ? JSON.parse(data) : data;
    } catch (e: any) {
      const status = e?.response?.status || 500;
      if (status === 404) {
        return res.status(404).json({
          error: 'issuer_not_on_chain',
          message: 'Issuer cannot be verified on-chain.'
        });
      }
      // Don’t bubble as 500 without context—return a clear lookup error
      return res.status(status).json({
        error: 'issuer_lookup_failed',
        message: e?.response?.data?.error || e?.message || 'Failed to retrieve issuer DID from chain'
      });
    }

    // Explicit handling for revoked issuer DID (include when & last tx if present)
    if (didDoc?.revoked === true) {
      const when = didDoc?.revokedTimestamp || didDoc?.auditTrail?.find((a: any) => a?.revoked)?.timestamp || null;
      const txId = didDoc?.auditTrail?.find((a: any) => a?.revoked)?.txId || null;
      return res.status(409).json({
        error: 'did_revoked',
        message: 'Issuer DID is revoked on-chain.',
        revokedTimestamp: when,
        revokedTxId: txId
      });
    }


    // 3) Check consent on-chain via /verifyAndLogAccess (expects result: true)
    try {
      const { data: ver } = await axios.post(
        `${selfBase}/verifyAndLogAccess`,
        {
          assetId: String(consentId),
          accessRequest: JSON.stringify({ purpose, operation })
        },
        { headers: { authorization: String(req.headers.authorization || '') } }
      );

      if (ver?.result === true) {
        // ✅ everything passed
        return res.json({
          active: true,
          consentId,
          issuerDid,
          vp_verified: true,
          chain: { issuer_revoked: false },
          consent_check: { result: true, reason: ver?.reason ?? 'ok', validUntil: ver?.validUntil ?? null }
        });
      }

      // Map common failure reasons from your chaincode service
      const reason = String(ver?.reason || ver?.status || 'unknown');
      if (/revoked/i.test(reason)) {
        return res.status(409).json({ error: 'consent_revoked', message: 'Consent is revoked on-chain.', details: ver });
      }
      if (/expired/i.test(reason)) {
        return res.status(409).json({ error: 'expired', message: 'Consent is expired on-chain.', details: ver });
      }
      if (/not[_\s-]?found|unknown/i.test(reason)) {
        return res.status(404).json({ error: 'consent_not_found', message: 'Consent does not exist on-chain.', details: ver });
      }

      // generic not-allowed / policy mismatch
      return res.status(403).json({ error: 'consent_not_allowed', message: 'Consent policy denied access.', details: ver });
    } catch (e: any) {
      // bubble up verifier service errors
      if (e?.response) {
        const st = e.response.status || 500;
        return res.status(st).json({ error: 'consent_check_failed', details: e.response.data });
      }
      throw e;
    }
  } catch (e) {
    next(e);
  }
});




// Holder revoke
// POST /agent/proofs/revoke  (holder black box)
router.post('/proofs/revoke', async (req: any, res, next) => {
  try {
    const peer = peerFromReq(req);
    requireRole(peer, 'holder');

    const { consentId, seed, privateKeyPem: bodyPrivPem } = req.body || {};
    if (!consentId) return res.status(400).json({ error: 'consentId is required' });
    if (!seed && !bodyPrivPem) {
      return res.status(400).json({ error: 'Provide either seed (base64/utf8) or privateKeyPem' });
    }

    // We’ll call our own API; reuse the same auth header so verifyToken passes
    const selfBase = `${req.protocol}://${req.get('host')}`;
    const authHdr  = { authorization: String(req.headers.authorization || '') };

    // 1) Fetch anchor to get createdTimestamp (the exact timestamp used in signatures)
    let anchor: any;
    try {
      const { data } = await axios.get(
        `${selfBase}/readVcAnchor/${encodeURIComponent(consentId)}`,
        { headers: authHdr }
      );
      anchor = data;
    } catch (e: any) {
      const st = e?.response?.status || 500;
      const msg = String(e?.response?.data?.error || e?.message || '').toLowerCase();

      // map "not found" situations to a clean 404
      if (st === 404 || msg.includes('not found') || msg.includes('does not exist')) {
        return res.status(404).json({
          error: 'consent_not_found_on_chain',
          message: `Consent "${consentId}" does not exist on the blockchain`
        });
      }
      // otherwise propagate the real error
      throw e;
    }


    const timestamp: string | undefined = anchor?.createdTimestamp;
    const status: string | undefined    = anchor?.status;

    if (!timestamp) {
      return res.status(422).json({ error: 'created_timestamp_missing', message: 'Anchor has no createdTimestamp' });
    }
    if (status && String(status).toLowerCase() !== 'active') {
      return res.status(409).json({ error: 'already_not_active', message: `Anchor status is ${status}` });
    }

    // 2) Derive or accept keypair
    let privateKeyPem = bodyPrivPem;
    let publicKeyPem: string | undefined;

    if (!privateKeyPem) {
      // derive from seed
      try {
        const { data: kp } = await axios.post(
          `${selfBase}/deriveKeypair`,
          { seed, assetId: String(consentId) },
          { headers: authHdr }
        );
        privateKeyPem = kp?.privateKeyPem;
        publicKeyPem  = kp?.publicKeyPem;
        if (!privateKeyPem || !publicKeyPem) {
          return res.status(500).json({ error: 'keypair_derivation_failed' });
        }
      } catch (e) {
        return res.status(500).json({ error: 'keypair_derivation_failed' });
      }
    }

    // If caller supplied a privateKeyPem but not publicKeyPem, we can lazily compute it via /deriveKeypair
    if (!publicKeyPem && seed) {
      try {
        const { data: kp2 } = await axios.post(
          `${selfBase}/deriveKeypair`,
          { seed, assetId: String(consentId) },
          { headers: authHdr }
        );
        publicKeyPem = kp2?.publicKeyPem;
      } catch {/* non-fatal; some ledgers may not validate pub on submit */}
    }

    // 3) Sign the action "assetId|timestamp"
    let signature: string;
    try {
      const { data: sig } = await axios.post(
        `${selfBase}/signVcAnchorAction`,
        { assetId: String(consentId), timestamp: String(timestamp), privateKeyPem },
        { headers: authHdr }
      );
      signature = sig?.signature;
      if (!signature) return res.status(500).json({ error: 'sign_failed' });
    } catch (e) {
      return res.status(500).json({ error: 'sign_failed' });
    }

    // 4) Revoke on-chain
    try {
      const payload: any = { assetId: String(consentId), signature };
      if (publicKeyPem) payload.publicKeyPem = publicKeyPem;

      const { data } = await axios.post(`${selfBase}/revokeVcAnchor`, payload, { headers: authHdr });
      // expected: { message: "VC anchor <id> revoked at <iso>" }
      return res.json({ revoked: true, consentId, message: data?.message || 'revoked' });
    } catch (e: any) {
      // surface ledger reasons
      const st = e?.response?.status || 500;
      const details = e?.response?.data || e?.message;
      return res.status(st).json({ revoked: false, error: 'revoke_failed', details });
    }
  } catch (e) {
    next(e);
  }
});



export default router;
