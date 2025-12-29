// src/routes/agent.ts
import { Router } from 'express';
import axios from 'axios';
import {
  hasRole,
  ensureDidKey, getPublicDid,
  createInvitation, receiveInvitation,
  listConnections, issueCredentialLd,
  requestPresentation, listProofEx, PeerId,
  deleteConnectionById,
  deleteConnectionsByAlias,
  getW3cCredential,listW3cCredentials
} from '../acapy';
import * as crypto from 'crypto';
import { ctx, } from '../helper/ctx';
import { connectionIdFromAlias } from '../helper/connections';
import { deriveEd25519FromSeed } from '../services/cryptography';
import { readDIDkeyFromFabric, readLatestActiveDidFromFabric,readVcAnchorFromFabric,withContract } from '../services/ledger';
const router = Router();
//import { getLatestByConnection, getLatestGlobal } from "../services/proofRequestCache";

type CredCandidate = { record_id?: string; issuanceDate?: string; __created?: string };

// export function peerFromReq(req: any): string {
//   // prefer old behavior if present
//   const fromJwt = req.userPayload?.selected_peer;
//   // fallback to header or query when using ACA-Py Bearer
//   const fromHdr = req.get?.('x-selected-peer') || req.headers['x-selected-peer'];
//   const fromQry = (req.query?.selected_peer as string) || (req.body?.selected_peer as string);
//   const v = String(fromJwt || fromHdr || fromQry || '').trim();
//   if (v === '1' || v === '2' || v === '3') return v;
//   throw Object.assign(new Error('selected_peer missing or invalid (expected 1/2/3)'), { status: 400 });
// }

// Role guards (capability based)
function requireRole(peer: string, role: string) {
  if (!hasRole(peer, role)) {
    throw Object.assign(new Error(`Operation requires role: ${role}`), { status: 403 });
  }
}


// --- Create a tenant wallet via :8000, forwarding to ACA-Py /multitenancy/wallet
// router.post('/tenants/create', async (req: any, res, next) => {
//   try {
//     const { peer, c } = ctx(req); // ctx gives us the selected peer + axios client
//     // Body passthrough with sane defaults
//     const {
//       wallet_name,
//       wallet_key,
//       label,
//       wallet_type = 'askar',
//       wallet_webhook_urls = [],         // optional
//       wallet_dispatch_type = 'base',    // 'base' means tenant webhooks go to the base wallet’s webhook; use 'default' if you set per-tenant webhooks in wallet_webhook_urls
//       // jwt_secret // (optional) if you want a per-tenant secret; otherwise ACA-Py uses server default
//       expires_in
//     } = req.body || {};

//     if (!wallet_name || !wallet_key || !label) {
//       return res.status(400).json({ error: 'wallet_name, wallet_key, and label are required' });
//     }

//     const payload: any = {
//       wallet_name,
//       wallet_key,
//       label,
//       wallet_type,
//       wallet_webhook_urls,
//       wallet_dispatch_type,
//       // jwt_secret,
//     };

//     const { data:created } = await c.post('/multitenancy/wallet', payload);
//     // ACA-Py returns { wallet_id, settings, token, ... }
//     let token = created.token;

//     // If caller asked for expiry, mint a new short-lived token and return that instead
//     if (expires_in) {
//       const { data: t } = await c.post(
//         `/multitenancy/wallet/${encodeURIComponent(created.wallet_id)}/token`,
//         { wallet_key, expires_in }
//       );
//       token = t.token;
//     }
//     return res.json({ peer, ...created });
//   } catch (e: any) {
//     const status = e?.response?.status || 500;
//     return res.status(status).json({ error: e?.response?.data || e?.message || 'tenant_create_failed' });
//   }
// });

// POST /agent/tenants/create  -> forwards to ACA-Py /multitenancy/wallet
// router.post('/tenants/create', async (req: any, res, next) => {
//   try {
//     const { peer, c } = ctx(req);

//     const {
//       wallet_name,
//       wallet_key,
//       label,
//       wallet_type = 'askar',
//       wallet_webhook_urls = [],
//       wallet_dispatch_type = 'base',   // 'base' means tenant webhooks go to the base wallet’s webhook; use 'default' if you set per-tenant webhooks in wallet_webhook_urls
//       jwt_secret,                      // OPTIONAL: per-tenant secret
//       expires_in,                       // OPTIONAL: seconds for short-lived token will create a new one right after the initial non-expiring one
//       new_token                           // optional (boolean)
//     } = req.body || {};

//     if (!wallet_name || !wallet_key || !label) {
//       return res.status(400).json({ error: 'wallet_name, wallet_key, and label are required' });
//     }

//      // 1) Pull admin key from the incoming request first; fall back to environment if needed
//     const adminKeyFromReq =
//       req.get('x-api-key') ||
//       req.get('x-acapy-api-key') ||                       // allow alternate naming
//       (req.headers['x-api-key'] as string) ||
//       (req.headers['x-acapy-api-key'] as string) ||
//       '';
//     // If you enabled ACA-Py admin key, expose it via env; otherwise this stays empty.
//     const adminKeyFromEnv =
//       process.env.ACAPY_ADMIN_API_KEY ||
//       process.env.ADMIN_API_KEY ||
//       process.env.AGENT_ADMIN_API_KEY ||
//       '';
    
//     const adminKey = adminKeyFromReq || adminKeyFromEnv;
//     const extraHeaders: any = adminKey ? { 'x-api-key': adminKey } : {};

//     const payload: any = {
//       wallet_name,
//       wallet_key,
//       label,
//       wallet_type,
//       wallet_webhook_urls,
//       wallet_dispatch_type,
//     };
//     if (jwt_secret) payload.jwt_secret = jwt_secret;

//     // 1) Create tenant
//     const { data: created } = await c.post('/multitenancy/wallet', payload, { headers: extraHeaders });

//     // 2) Decide which token to return
//     let token = created.token as string;

//     // If caller asked for expiry, mint a short-lived token (overrides the created.token)
//     if (expires_in) {
//       const { data: t } = await c.post(
//         `/multitenancy/wallet/${encodeURIComponent(created.wallet_id)}/token`,
//         { wallet_key, expires_in },
//         { headers: extraHeaders }
//       );
//       token = t.token;
//     }

//     // Return the ACA-Py object but ensure we surface the token we actually want callers to use
//     return res.json({ peer, ...created, token });
//   } catch (e: any) {
//     const status = e?.response?.status || 500;
//     return res.status(status).json({
//       error: e?.response?.data || e?.message || 'tenant_create_failed'
//     });
//   }
// });

// POST /agent/tenants/create


// POST /agent/tenants/create
router.post('/tenants/create', async (req: any, res, next) => {
  try {
    const { peer, c } = ctx(req);

    const {
      wallet_name,
      wallet_key,
      label,
      wallet_type = 'askar',
      wallet_webhook_urls = [],
      wallet_dispatch_type = 'base',   // 'base' means tenant webhooks go to the base wallet’s webhook; use 'default' if you set per-tenant webhooks in wallet_webhook_urls
      //jwt_secret,                      // OPTIONAL: per-tenant secret
      new_token                           // optional (boolean or "true"/"false")
    } = req.body || {};

    if (!wallet_name || !wallet_key || !label) {
      return res.status(400).json({ error: 'wallet_name, wallet_key, and label are required' });
    }

    // admin key passthrough (if ACA-Py admin API is protected)
    const adminKeyFromReq =
      req.get('x-api-key') ||
      req.get('x-acapy-api-key') ||
      (req.headers['x-api-key'] as string) ||
      (req.headers['x-acapy-api-key'] as string) ||
      '';
    // expose it via env; otherwise this stays empty.
    const adminKeyFromEnv =
      process.env.ACAPY_ADMIN_API_KEY ||
      process.env.ADMIN_API_KEY ||
      process.env.AGENT_ADMIN_API_KEY ||
      '';
    const adminKey = adminKeyFromReq || adminKeyFromEnv;
    const extraHeaders: any = adminKey ? { 'x-api-key': adminKey } : {};

    // normalize new_token flag
    const wantNewToken =
      new_token === true ||
      String(new_token).toLowerCase() === 'true' ||
      Number(new_token) === 1 ||
      (req.query?.new_token && String(req.query.new_token).toLowerCase() === 'true');

    // helpers
    const findWalletByName = async (name: string) => {
      const { data } = await c.get('/multitenancy/wallets', {
        params: { limit: 1000 },
        headers: extraHeaders
      });
      return (data?.results || []).find((w: any) => w?.settings?.['wallet.name'] === name);
    };

    const mintToken = async (wallet_id: string) => {
      const { data } = await c.post(
        `/multitenancy/wallet/${encodeURIComponent(wallet_id)}/token`,
        { wallet_key },
        { headers: extraHeaders }
      );
      return data?.token;
    };

    // ---- path: only mint a new token (do NOT create)
    if (wantNewToken) {
      const w = await findWalletByName(wallet_name);
      if (!w) {
        return res.status(404).json({ error: 'wallet_not_found', message: `No wallet named "${wallet_name}"` });
      }
      const token = await mintToken(w.wallet_id);
      return res.json({ peer, created: false, wallet_id: w.wallet_id, settings: w.settings, token });
    }

    // ---- path: create tenant (default)
    const payload: any = {
      wallet_name,
      wallet_key,
      label,
      wallet_type,
      wallet_webhook_urls,
      wallet_dispatch_type
    };
    //if (jwt_secret) payload.jwt_secret = jwt_secret;

    try {
      const { data: created } = await c.post('/multitenancy/wallet', payload, { headers: extraHeaders });
      // ACA-Py returns a (non-expiring) token for the new tenant
      return res.json({ peer, ...created, token: created.token });
    } catch (e: any) {
      const msg = e?.response?.data || e?.message || '';
      const status = e?.response?.status || 500;

      // Already exists: only mint a token if explicitly requested (wantNewToken)
      if (status === 409 || /exist/i.test(String(msg))) {
        const w = await findWalletByName(wallet_name);
        if (!w) return res.status(409).json({ error: 'wallet_already_exists_but_not_listed' });

        // No new_token requested -> return 409 with details, but DO NOT mint a token
        return res.status(409).json({
          error: 'wallet_already_exists',
          peer,
          created: false,
          wallet_id: w.wallet_id,
          settings: w.settings,
          hint: 'Call again with "new_token": true to mint a new token.'
        });
      }

      return res.status(status).json({ error: msg || 'tenant_create_failed' });
    }
  } catch (e) {
    next(e);
  }
});



// DID bootstrap (any peer or guard if you want)
// router.post('/did/bootstrap', async (req: any, res, next) => {
//   try {
//     const { peer } = ctx(req);  
//     const did = await ensureDidKey(peer);
//     const pub = await getPublicDid(peer);
//     res.json({ peer, did: pub ?? did });
//   } catch (e) { next(e); }
// });
// DID bootstrap (+ optional persist to Fabric)
// /did/bootstrap
// router.post('/did/bootstrap', async (req, res, next) => {
//   try {
//     const { peer, selfBase } = ctx(req);
//     const forceNew = !!req.body?.new;
//     const keyType  = req.body?.keyType as ('bls12381g2'|'ed25519')|undefined;

//     const did = await ensureDidKey(req, peer, { forceNew, key_type: keyType });
//     const pub = await getPublicDid(req, peer);
//     const didToStore = pub ?? did;

//     const persist = Boolean(req.body?.persist) || hasRole(peer, 'issuer');
//     let stored = false, storeResult: any;

//     if (persist) {
//       const headers = {
//         authorization: String(req.headers.authorization || ''),
//         'x-selected-peer': String(peer)     // <-- forward the peer
//       };
//       try {
//         const { data } = await axios.post(`${selfBase}/storeDIDkey/${encodeURIComponent(didToStore)}`, undefined, { headers });
//         stored = true; storeResult = data;
//       } catch (e: any) {
//         const msg = e?.response?.data?.error || e?.message || '';
//         if (/already exists|exists/i.test(msg)) stored = true; else throw e;
//       }
//     }

//     res.json({ peer, did: didToStore, new: forceNew, keyType: keyType ?? 'bls12381g2', stored, storeResult });
//   } catch (e) { next(e); }
// });

router.post('/did/bootstrap', async (req, res, next) => {
  try {
    const { peer, authHdr, selfBase } = ctx(req);   // <- from ctx(req)
    const forceNew = !!req.body?.new;
    const keyType  = req.body?.keyType as ('bls12381g2'|'ed25519')|undefined;

    const did = await ensureDidKey(req, peer, { forceNew, key_type: keyType });
    const pub = await getPublicDid(req, peer);
    const didToStore = pub ?? did;

    const persist = Boolean(req.body?.persist) || hasRole(peer, 'issuer');
    let stored = false, storeResult: any;

    if (persist) {
      const headers = { ...authHdr, 'x-selected-peer': String(peer) }; // <- build here
      try {
        const { data } = await axios.post(
          `${selfBase}/storeDIDkey/${encodeURIComponent(didToStore)}`,
          undefined,
          { headers }
        );
        stored = true; storeResult = data;
      } catch (e: any) {
        const msg = e?.response?.data?.error || e?.message || '';
        if (/already exists|exists/i.test(msg)) stored = true; else throw e;
      }
    }

    res.json({ peer, did: didToStore, new: forceNew, keyType: keyType ?? 'bls12381g2', stored, storeResult });
  } catch (e) { next(e); }
});


// Invitations
router.post('/invitations/create', async (req: any, res, next) => {
  try {
    const { peer } = ctx(req);           // typically issuer or verifier
    const { contact_alias, autoAccept = true } = req.body || {};
    const inv = await createInvitation(req, peer, contact_alias, !!autoAccept);
    res.json({ peer, ...inv });
  } catch (e) { next(e); }
});

// router.post('/invitations/accept', async (req, res, next) => {
//   try {
//     const { peer } = ctx(req);    // holder agent peer
//     const { invitation, alias } = req.body || {};
//     if (!invitation) {
//       return res.status(400).json({ error: 'invitation required' });
//     }
//     const out = await receiveInvitation(req, peer, invitation, alias);

//     res.json({ peer, ...out });
//   } catch (e) {
//     next(e);
//   }
// });
router.post('/invitations/accept', async (req, res, next) => {
  try {
    const { peer } = ctx(req);    // holder agent peer
    const { invitation, invitation_url, contact_alias } = req.body || {};

    let inv = invitation;
    if (!inv && invitation_url) {
      try {
        const u = new URL(invitation_url);
        const b64 = u.searchParams.get('oob') || u.searchParams.get('c_i');
        if (!b64) return res.status(400).json({ error: 'invalid_invitation_url' });
        // base64url -> base64
        const json = Buffer.from(b64.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8');
        inv = JSON.parse(json);
      } catch (e) {
        return res.status(400).json({ error: 'bad_invitation_url', details: String(e) });
      }
    }

    if (!inv) return res.status(400).json({ error: 'invitation required' });

    const out = await receiveInvitation(req, peer, inv, contact_alias);
    res.json({ peer, ...out });
  } catch (e) {
    next(e);
  }
});




// DELETE /agent/connections/:id  -> delete a single connection by id
router.delete('/connections/:id', async (req: any, res, next) => {
  try {
    const { peer } = ctx(req);          // issuer / holder / verifier tenant
    const { id } = req.params;

    await deleteConnectionById(req, peer, id);

    res.json({
      peer,
      deleted: [id],
      count: 1,
    });
  } catch (e) {
    next(e);
  }
});



// DELETE /agent/connections/:id
router.delete('/connections/:id', async (req: any, res, next) => {
  try {
    const { peer } = ctx(req);  // issuer / holder / verifier tenant
    const { id } = req.params;

    const result = await deleteConnectionById(req, peer, id);
    res.json({ peer, ...result });
  } catch (e) {
    next(e);
  }
});


// DELETE /agent/connections?alias=DrX[&state=active]
router.delete('/connections', async (req: any, res, next) => {
  try {
    const { peer } = ctx(req);
    const { contact_alias, state } = req.query;

    if (!contact_alias) {
      return res.status(400).json({ error: 'alias query parameter is required' });
    }

    const result = await deleteConnectionsByAlias(
      req,
      peer,
      String(contact_alias),
      state ? { state: String(state) } : undefined,
    );

    res.json({ peer, ...result });
  } catch (e) {
    next(e);
  }
});

// router.get('/connections', async (req: any, res, next) => {
//   try {
//     const { peer } = ctx(req);  
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


// async function connectionIdFromAlias(peer: PeerId, alias: string, req: any): Promise<string> {
//   // const c = clientFor(peer);
//   const c = clientForReq(req, peer);
//   const { data } = await c.get('/connections', { params: { alias, state: 'active' } });
//   const list = data?.results || [];
//   if (!list.length) throw Object.assign(new Error(`No active connection with alias "${alias}"`), { status: 404 });
//   // pick the most recently updated/created
//   list.sort((a: any, b: any) => new Date(b.updated_at || b.created_at || 0).getTime() - new Date(a.updated_at || a.created_at || 0).getTime());
//   return list[0].connection_id;
// }


// Propose credential (role gated)


// router.post('/credentials/propose', async (req: any, res, next) => {
//   try {
//     const { peer, c } = ctx(req);              // holder peer (e.g., "2")
//     requireRole(peer, 'holder');

//     const { alias, consentId, type = 'EmployeeCredential' } = req.body || {};
//     if (!alias || !consentId) {
//       return res.status(400).json({ error: 'alias and consentId are required' });
//     }

//     // Resolve active connection_id to the issuer
//     const connection_id = await connectionIdFromAlias(c, alias);

//     // HOLDER: get or create public BLS did:key
//     let holderDid = await getPublicDid(req, peer);
//     if (!holderDid) {
//       holderDid = await ensureDidKey(req, peer, { key_type: 'bls12381g2' });
//     }

//     // Build proposal credential WITHOUT issuer (issuer should auto-fill)
//     const makeCredential = (issuerDid?: string) => ({
//       '@context': [
//         'https://www.w3.org/2018/credentials/v1',
//         'https://w3id.org/security/bbs/v1',
//         { '@vocab': 'https://example.com/vocab#' }
//       ],
//       type: ['VerifiableCredential', type],
//       ...(issuerDid ? { issuer: issuerDid } : {}),     // only include on retry
//       issuanceDate: new Date().toISOString(),
//       credentialSubject: {
//         id: holderDid,
//         consentId: String(consentId)
//       }
//     });

//     const sendProposal = async (credential: any) => {
//       const payload = {
//         auto_remove: false,
//         connection_id,
//         comment: `Holder-initiated ${type} for consentId=${consentId}`,
//         filter: {
//           ld_proof: {
//             credential,
//             options: { proofType: 'BbsBlsSignature2020' }
//           }
//         }
//       };
//       return c.post('/issue-credential-2.0/send-proposal', payload);
//     };

//     // 1) Try without issuer (preferred flow)
//     try {
//       const { data } = await sendProposal(makeCredential(/* no issuer */));
//       return res.json({ peer, connection_id, holderDid, proposed: true, autoIssuer: true, result: data });
//     } catch (e: any) {
//       const status = e?.response?.status || 0;
//       const msg = (e?.response?.data && JSON.stringify(e.response.data)) || String(e?.message || '');
//       // If not a schema/validation failure, bubble up
//       if (status !== 422 && status !== 400) throw e;

//       // 2) Retry once WITH issuer fetched from issuer base wallet (peer "1")
//       try {
//         const issuerPeer: PeerId = '1';
//         let issuerDid = await getPublicDid(req, issuerPeer);
//         if (!issuerDid) {
//           issuerDid = await ensureDidKey(req, issuerPeer, { key_type: 'bls12381g2' });
//         }
//         const { data } = await sendProposal(makeCredential(issuerDid));
//         return res.json({
//           peer, connection_id, holderDid, issuerDid,
//           proposed: true, autoIssuer: false, retriedWithIssuer: true, result: data
//         });
//       } catch (e2: any) {
//         const status2 = e2?.response?.status || 500;
//         return res.status(status2).json({
//           error: 'proposal_failed',
//           first_attempt: { status, msg },
//           second_attempt: e2?.response?.data || e2?.message || 'retry_error'
//         });
//       }
//     }
//   } catch (e) {
//     next(e);
//   }
// });




//!
// function makeConsentId(): string {
//   const salt = crypto.randomUUID?.() || crypto.randomBytes(16).toString('hex');
//   return 'c_' + crypto.createHash('sha256').update(`${Date.now()}|${salt}`).digest('hex').slice(0, 40);
// }


// router.post('/credentials/propose', async (req: any, res, next) => {
//   try {
//     const { peer, c } = ctx(req);  // holder peer
//     requireRole(peer, 'holder');

//     const { alias, items, seed } = req.body || {};
//     if (!alias) return res.status(400).json({ error: 'alias is required' });
//     if (!Array.isArray(items) || items.length === 0)
//       return res.status(400).json({ error: 'items[] (non-empty) is required' });
//     if (!items.every((s: any) => typeof s === 'string' && s.trim()))
//       return res.status(400).json({ error: 'items must be non-empty strings' });

//     const connection_id = await connectionIdFromAlias(c, alias);

//     // Holder BLS did:key (for BBS+ subject)
//     let holderDid = await getPublicDid(req, peer);
//     if (!holderDid) holderDid = await ensureDidKey(req, peer, { key_type: 'bls12381g2' });

//     const consentedItems = normItems(items);
//     const consentId = makeConsentId();

//     // Seed hygiene: ensure 32 bytes base64
//     let usedSeed = seed || crypto.randomBytes(32).toString('base64');
//     try {
//       const raw = Buffer.from(usedSeed, 'base64');
//       if (raw.length !== 32) usedSeed = crypto.randomBytes(32).toString('base64');
//     } catch { usedSeed = crypto.randomBytes(32).toString('base64'); }

//     const { publicKeyPem } = deriveEd25519FromSeed(usedSeed, consentId);

//     const baseCredential: any = {
//       '@context': [
//         'https://www.w3.org/2018/credentials/v1',
//         'https://w3id.org/security/bbs/v1',
//         { '@vocab': 'https://example.com/vocab#' }
//       ],
//       type: ['VerifiableCredential', 'ConsentCredential'],
//       issuanceDate: new Date().toISOString(),
//       // issuer omitted on first attempt
//       credentialSubject: { id: holderDid, consentId, consentedItems, publicKeyPem }
//     };

//     const sendProposal = (cred: any) =>
//       c.post('/issue-credential-2.0/send-proposal', {
//         auto_remove: false,
//         connection_id,
//         comment: `Holder-initiated ConsentCredential for items=${consentedItems.join(',')}`,
//         filter: { ld_proof: { credential: cred, options: { proofType: 'BbsBlsSignature2020' } } }
//       });

//     // Attempt 1 — without issuer (some ACA-Py builds accept and auto-fill)
//     try {
//       const { data } = await sendProposal(baseCredential);
//       return res.json({
//         peer, connection_id, holderDid, consentId, publicKeyPem,
//         proposed: true, autoIssuer: true, result: data
//       });
//     } catch (e: any) {
//       const status = e?.response?.status || 0;
//       const body   = e?.response?.data;
//       if (status !== 400 && status !== 422) {
//         return res.status(status || 500).json({ error: 'proposal_failed', details: body || e?.message });
//       }

//       // Attempt 2 — resolve latest active issuer DID from Fabric
//       let creator = (req.query.creator || process.env.ISSUER_CREATOR || 'Org1').toString().trim();
//       if (creator.endsWith('MSP')) creator = creator.slice(0, -3);

//       let rec: any;
//       try {
//         const payload = req.userPayload;
//         rec = await readLatestActiveDidFromFabric(payload, creator);
//       } catch (err: any) {
//         const msg = String(err?.message || '');
//         const code = msg.includes('No active DID for creator') ? 404 : 502;
//         return res.status(code).json({ error: 'resolve_issuer_did_failed', details: msg, creator });
//       }
//       if (!rec || rec.revoked || !rec.didID) {
//         return res.status(404).json({ error: 'no_active_issuer_did', details: { creator } });
//       }

//       const issuerDid = rec.didID;

//       try {
//         const { data } = await sendProposal({ ...baseCredential, issuer: issuerDid });
//         return res.json({
//           peer, connection_id, holderDid, consentId, publicKeyPem, issuerDid,
//           proposed: true, autoIssuer: false, retriedWithIssuer: true, result: data
//         });
//       } catch (e2: any) {
//         const st2 = e2?.response?.status || 500;
//         return res.status(st2).json({
//           error: 'proposal_rejected_after_retry',
//           first_attempt: body || '422/400 (missing issuer)',
//           second_attempt: e2?.response?.data || e2?.message || 'unknown'
//         });
//       }
//     }
//   } catch (e) { next(e); }
// });
//!

// Connections
router.get('/connections', async (req, res, next) => {
  try {
    const { peer, c } = ctx(req);          // <- use c from ctx
    const { data } = await c.get('/connections');
    res.json({ peer, results: data?.results ?? [] });
  } catch (e) { next(e); }
});


function makeConsentId(): string {
  const salt = crypto.randomUUID?.() || crypto.randomBytes(16).toString('hex');
  return 'c_' + crypto.createHash('sha256').update(`${Date.now()}|${salt}`).digest('hex').slice(0, 40);
}

// router.post('/credentials/propose', async (req: any, res, next) => {
//   try {
//     const { peer, c } = ctx(req);  // holder peer
//     requireRole(peer, 'holder');

//     // NEW: accept optional purposes/operations/durationDays
//     const { alias, items, seed, purposes, operations, durationDays, publicKeyPem: bodyPub, consentId: bodyConsentId } = req.body || {};
//     if (!alias) return res.status(400).json({ error: 'alias is required' });
//     if (!Array.isArray(items) || items.length === 0)
//       return res.status(400).json({ error: 'items[] (non-empty) is required' });
//     if (!items.every((s: any) => typeof s === 'string' && s.trim()))
//       return res.status(400).json({ error: 'items must be non-empty strings' });

//     const connection_id = await connectionIdFromAlias(c, alias);

//     // Holder BLS did:key (for BBS+ subject)
//     let holderDid = await getPublicDid(req, peer);
//     if (!holderDid) holderDid = await ensureDidKey(req, peer, { key_type: 'bls12381g2' });

//     const consentedItems = normItems(items);
//     //const consentId = makeConsentId();
//     let consentId = bodyConsentId ? String(bodyConsentId).trim() : makeConsentId();

//     // OPTIONAL uniqueness check on-chain when client supplies consentId
//     if (bodyConsentId) {
//       try {
//         const payload = req.userPayload;
//         const anchor = await readVcAnchorFromFabric(payload, consentId);

//         // If the call returned a truthy anchor, it exists -> conflict
//         if (anchor) {
//           return res.status(409).json({ error: 'consentId_exists', consentId });
//         }
//         // If it returned falsy without throwing, treat as not found and proceed
//       } catch (e: any) {
//         const msg = String(e?.message || '');
//         // Treat common "not found" variants as OK to proceed
//         if (/(not\s*found|404|no\s+such\s+key|does\s+not\s+exist|missing|absent)/i.test(msg)) {
//           // proceed
//         } else {
//           return res.status(502).json({ error: 'anchor_check_failed', details: msg });
//         }
//       }
//     }


// Minimal changes: allow items to be omitted and auto-fill from latest proof request (optional mirrorAlias).
function extractRequiredItemsFromPD(rec: any): string[] {
  const defs =
    rec?.by_format?.pres_request?.dif?.presentation_definition?.input_descriptors ||
    rec?.pres_request?.dif?.presentation_definition?.input_descriptors ||
    rec?.presentation_request_dict?.dif?.presentation_definition?.input_descriptors ||
    [];
  const fields = (Array.isArray(defs) && defs[0]?.constraints?.fields) || [];
  return fields
    .filter((f: any) =>
      Array.isArray(f?.path) &&
      f.path.includes('$.credentialSubject.consentedItems[*]') &&
      f?.filter?.const != null
    )
    .map((f: any) => String(f.filter.const).trim().toLowerCase());
}

router.post('/credentials/propose', async (req: any, res, next) => {
  try {
    const { peer, c } = ctx(req);  // holder peer
    requireRole(peer, 'holder');

    // accept optional purposes/operations/durationDays, optional mirrorAlias
    const {
      issuer_alias,
      requested_payload,
      seed,
      purposes,
      operations,
      durationDays,
      publicKeyPem: bodyPub,
      consentId: bodyConsentId,
      verifier_alias,
    } = req.body || {};

    if (!issuer_alias) return res.status(400).json({ error: 'issuer_alias is required' });

    const connection_id = await connectionIdFromAlias(c, issuer_alias);

    // Holder BLS did:key (for BBS+ subject)
    let holderDid = await getPublicDid(req, peer);
    if (!holderDid) holderDid = await ensureDidKey(req, peer, { key_type: 'bls12381g2' });

    // Items: use request body if present; else mirror from latest cached proof request (optionally by mirrorAlias)
   let effectiveItems: string[] = Array.isArray(requested_payload) ? requested_payload : [];
    const presExId = String(
    req.body?.pres_ex_id ?? req.body?.presExId ?? req.body?.requestId ?? ''
  ).trim();
    // If not supplied, try: requestId/presExId -> mirrorAlias -> latest
    if (effectiveItems.length === 0) {
      // 1) Specific proof request id
      if (presExId) {
        try {
          const { data: rec } = await c.get(`/present-proof-2.0/records/${encodeURIComponent(presExId)}`);
          if (rec?.state === 'request-received') {
            const reqItems = extractRequiredItemsFromPD(rec);
            if (reqItems.length) effectiveItems = reqItems;
          }
        } catch {
          // ignore; fall through to next strategy
        }
      }
    }
    if (effectiveItems.length === 0) {
      // Resolve optional mirrorAlias -> connection_id filter
      let connection_id_filter: string | undefined;
      if (verifier_alias) {
        try {
          connection_id_filter = await connectionIdFromAlias(c, verifier_alias);
        } catch {
          // ignore; will fall back to global latest
        }
      }

      // Pull latest request-received record(s) directly from ACA-Py
      const params: any = { state: 'request-received' };
      if (connection_id_filter) params.connection_id = connection_id_filter;

      const { data } = await c.get('/present-proof-2.0/records', { params });
      const reqs: any[] = (data?.results || []);
      if (reqs.length) {
        reqs.sort((a, b) =>
          new Date(b?.updated_at || b?.created_at || 0).getTime() -
          new Date(a?.updated_at || a?.created_at || 0).getTime()
        );
        const latest = reqs[0];
        const required = extractRequiredItemsFromPD(latest);
        if (required.length) effectiveItems = required;
      }
    }

    if (!Array.isArray(effectiveItems) || effectiveItems.length === 0) {
      return res.status(400).json({ error: 'items[] (non-empty) is required (no pending proof request found)' });
    }
    if (!effectiveItems.every((s: any) => typeof s === 'string' && s.trim())) {
      return res.status(400).json({ error: 'items must be non-empty strings' });
    }
        const consentedItems = normItems(effectiveItems);

    // consentId: accept optional, else generate
    let consentId = bodyConsentId ? String(bodyConsentId).trim() : makeConsentId();

    // OPTIONAL uniqueness check on-chain when client supplies consentId
    if (bodyConsentId) {
      try {
        const payload = req.userPayload;
        const anchor = await readVcAnchorFromFabric(payload, consentId);
        if (anchor) return res.status(409).json({ error: 'consentId_exists', consentId });
      } catch (e: any) {
        const msg = String(e?.message || '');
        // proceed if clearly "not found"
        if (!/(not\s*found|404|no\s+such\s+key|does\s+not\s+exist|missing|absent)/i.test(msg)) {
          return res.status(502).json({ error: 'anchor_check_failed', details: msg });
        }
      }
    }

    // Seed/publicKey handling
    let publicKeyPem = bodyPub;
    if (publicKeyPem) {
      try { crypto.createPublicKey(publicKeyPem); }
      catch { return res.status(400).json({ error: 'invalid_publicKeyPem' }); }
    }
    if (!publicKeyPem) {
      if (!(typeof seed === 'string' && seed.trim() !== '')) {
        return res.status(400).json({
          error: 'seed_required',
          message: 'Provide either publicKeyPem or seed; random generation is disabled so revocation remains deterministic.'
        });
      }
      ({ publicKeyPem } = deriveEd25519FromSeed(seed, consentId));
    }

    // Normalize purposes/operations with defaults + canonicalize
    const toArr = (x: any) => Array.isArray(x) ? x : (x ? [String(x)] : []);
    const canon = (arr: string[]) =>
      Array.from(new Set(arr.map(s => s.trim().toLowerCase()))).sort();

    const purposesArr   = canon(toArr(purposes ?? 'pcode001'));
    const operationsArr = canon(toArr(operations ?? 'ocode001'));

    const durDaysNum = Number(durationDays);
    const includeDuration = Number.isFinite(durDaysNum) && durDaysNum > 0;

    const baseCredential: any = {
      '@context': [
        'https://www.w3.org/2018/credentials/v1',
        'https://w3id.org/security/bbs/v1',
        { '@vocab': 'https://example.com/vocab#' }
      ],
      type: ['VerifiableCredential', 'ConsentCredential'],
      issuanceDate: new Date().toISOString(),
      // issuer omitted on first attempt
      credentialSubject: {
        id: holderDid,
        consentId,
        consentedItems,
        publicKeyPem,
        purposes: purposesArr,
        operations: operationsArr,
        ...(includeDuration ? { durationDays: durDaysNum } : {})
      }
    };

    const sendProposal = (cred: any) =>
      c.post('/issue-credential-2.0/send-proposal', {
        auto_remove: false,
        connection_id,
        comment: `ConsentCredential items=${consentedItems.join(',')}`,
        filter: { ld_proof: { credential: cred, options: { proofType: 'BbsBlsSignature2020' } } }
      });

    // Attempt 1 — without issuer (some ACA-Py builds accept and auto-fill)
    try {
      const { data } = await sendProposal(baseCredential);
      return res.json({
        peer, connection_id, holderDid, consentId, publicKeyPem,
        proposed: true, autoIssuer: true, result: data
      });
    } catch (e: any) {
      const status = e?.response?.status || 0;
      const body   = e?.response?.data;
      if (status !== 400 && status !== 422) {
        return res.status(status || 500).json({ error: 'proposal_failed', details: body || e?.message });
      }

      // Attempt 2 — resolve latest active issuer DID from Fabric
      let creator = (req.query.creator || process.env.ISSUER_CREATOR || 'Org1').toString().trim();
      if (creator.endsWith('MSP')) creator = creator.slice(0, -3);

      let rec: any;
      try {
        const payload = req.userPayload;
        rec = await readLatestActiveDidFromFabric(payload, creator);
      } catch (err: any) {
        const msg = String(err?.message || '');
        const code = msg.includes('No active DID for creator') ? 404 : 502;
        return res.status(code).json({ error: 'resolve_issuer_did_failed', details: msg, creator });
      }
      if (!rec || rec.revoked || !rec.didID) {
        return res.status(404).json({ error: 'no_active_issuer_did', details: { creator } });
      }

      const issuerDid = rec.didID;

      try {
        const { data } = await sendProposal({ ...baseCredential, issuer: issuerDid });
        return res.json({
          peer, connection_id, holderDid, consentId, publicKeyPem, issuerDid,
          proposed: true, autoIssuer: false, retriedWithIssuer: true, result: data
        });
      } catch (e2: any) {
        const st2 = e2?.response?.status || 500;
        return res.status(st2).json({
          error: 'proposal_rejected_after_retry',
          first_attempt: body || '422/400 (missing issuer)',
          second_attempt: e2?.response?.data || e2?.message || 'unknown'
        });
      }
    }
  } catch (e) { next(e); }
});




// Issue credential (role gated)


router.post('/credentials/issue', async (req: any, res, next) => {
  try {
    const { peer, c } = ctx(req); 
    requireRole(peer, 'issuer');

    const { alias, holderDid, consentId, issuerDid, proofType = 'BbsBlsSignature2020' } = req.body || {};
    if (!alias || !holderDid || !consentId) {
      return res.status(400).json({ error: 'alias, holderDid and consentId are required' });
    }

    // 1) resolve alias -> connection_id
   const connection_id = await connectionIdFromAlias(c, alias);

    // 2) pick issuer DID (use provided, else latest public or ensure one)
    const issuer =
      issuerDid ||
      (await getPublicDid(req, peer)) ||
      (await ensureDidKey(req, peer));

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
    const out = await issueCredentialLd(req, peer, connection_id, credential, proofType);
    res.json({ peer, issued: true, connection_id, issuer, result: out });
  } catch (e) { next(e); }
});





// GET /agent/credentials/w3c       → list all
// router.get('/credentials/w3c', async (req: any, res, next) => {
//   try {
//     const { peer } = ctx(req);   // still driven by x-selected-peer or similar
//     const results = await listW3cCredentials(req, peer);
//     res.json({ peer, results });
//   } catch (e) {
//     next(e);
//   }
// });

// // GET /agent/credentials/w3c/:id   → get one by record_id
// router.get('/credentials/w3c/:id', async (req: any, res, next) => {
//   try {
//     const { peer } = ctx(req);
//     const { id } = req.params;
//     const record = await getW3cCredential(req, peer, id);
//     res.json({ peer, ...record });
//   } catch (e) {
//     next(e);
//   }
// });

router.get('/credentials/w3c/:id?', async (req: any, res, next) => {
  try {
    const { peer, c } = ctx(req);  // holder peer
    requireRole(peer, 'holder');
    const { id } = req.params;
    

    if (id) {
      const record = await getW3cCredential(req, peer, id);
      return res.json({ peer, ...record });
    }

    const results = await listW3cCredentials(req, peer);
    return res.json({
      peer,
      count: results.length,
      results,
    });
  } catch (e) {
    next(e);
  }
});



// Proof request (role gated)


function normItems(items: string[]): string[] {
  return Array.from(new Set(items.map(s => String(s).trim().toLowerCase()))).sort();
}

function buildItemsPD(presDef: any, name: string, purpose: string, items: string[]) {
  const PD = { ...(presDef || {}) };
  PD.id = PD.id || crypto.randomUUID?.() || String(Date.now());
  PD.format = PD.format || { ldp_vp: { proof_type: ['BbsBlsSignature2020'] } };
  PD.input_descriptors = PD.input_descriptors || [{
    id: 'consent_vc',
    name,
    schema: [{ uri: 'https://www.w3.org/2018/credentials#VerifiableCredential' }],
    constraints: { limit_disclosure: 'required', fields: [] }
  }];

  const d0 = PD.input_descriptors[0];
  d0.constraints = d0.constraints || {};
  d0.constraints.fields = d0.constraints.fields || [];

  // Require the items you care about
  for (const it of items) {
    d0.constraints.fields.push({
      path: ['$.credentialSubject.consentedItems[*]'],
      purpose,
      filter: { const: it }
    });
  }

  // ALSO require consentId so verifiers can link to the on-chain anchor
  d0.constraints.fields.push({
    path: ['$.credentialSubject.consentId'],
    purpose: 'Anchor lookup (link VC to on-chain consent)',
    // any string is acceptable; if you want stricter, use a regex pattern for your IDs
    filter: { type: 'string' }
    // e.g. filter: { pattern: '^c_[0-9a-f]{40}$' }
  });

  return PD;
}


router.post('/proofs/request', async (req: any, res, next) => {
  try {
    const { peer, c } = ctx(req);
    requireRole(peer, 'verifier');

    const {
      holder_alias,
      request_payload,                      // NEW: array of strings
      purpose = 'Consent check',
      name = request_payload?.length ? `Consent check: ${request_payload.join(', ')}` : 'Consent check',
      presentation_definition,
      options
    } = req.body || {};

    if (!holder_alias) return res.status(400).json({ error: 'holder_alias is required' });
    if (!Array.isArray(request_payload) || request_payload.length === 0)
      return res.status(400).json({ error: 'request_payload[] (non-empty) is required' });

    const connection_id = await connectionIdFromAlias(c, holder_alias);
    const wanted = normItems(request_payload);
    const presDef = buildItemsPD(presentation_definition, name, purpose, wanted);

    const out = await requestPresentation(req, peer, connection_id, presDef, options);
    res.json({ peer, connection_id, requested: true, wantedItems: wanted, result: out });
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


// router.get('/proofs/inbox', async (req: any, res, next) => {
//   try {
//     const { peer, c } = ctx(req);
//     requireRole(peer, 'holder');

//     //const base = getAgentConfig(peer).baseUrl;
//     //const c = clientForReq(req, peer);
//     // NEW: map connection_id -> alias (fallback to their_label)
//     const conns = await listConnections(req, peer);
//     const aliasByConn: Record<string, string | null> = {};
//     for (const conn of conns || []) {
//       const id = conn?.connection_id;
//       if (id) aliasByConn[id] = conn?.alias ?? conn?.their_label ?? null;
//     }

//     // 1) Get all proof records
//     // const { data } = await axios.get(`${base}/present-proof-2.0/records`);
//     const { data } = await c.get('/present-proof-2.0/records');
//     const records = (data?.results || []).filter((r: any) => r.state === 'request-received');

//     const results: any[] = [];
//     for (const r of records) {
//       // normalize id across Aca-Py versions
//       const pres_ex_id = r.pres_ex_id || r.presentation_exchange_id || r._id;

//       // 2) Query candidate credentials for this proof exchange
//       // const { data: cands } = await axios.get(
//       //   `${base}/present-proof-2.0/records/${encodeURIComponent(pres_ex_id)}/credentials`
//       // );
//       const { data: cands } = await c.get(`/present-proof-2.0/records/${encodeURIComponent(pres_ex_id)}/credentials`);

//       const norm = (cands || []).map((c: any) => ({
//         record_id: c.record_id,
//         issuanceDate: c.issuanceDate,
//         __created: c.proof?.created,
//       }));

//       const suggested = norm.length === 1 ? [norm[0].record_id] : pickRecordIds(norm);

//       // 3) Extract DIF options (challenge/domain) from the proof request
//       const difOptions =
//         r?.by_format?.pres_request?.dif?.options
//         || r?.pres_request?.dif?.options
//         || r?.presentation_request_dict?.dif?.options
//         || {};

//       const challenge = difOptions.challenge ?? null;
//       const domain    = difOptions.domain ?? null;

//       const connection_id = r.connection_id;
//       const alias = aliasByConn[connection_id] ?? null; // <-- added

//       results.push({
//         pres_ex_id,
//         connection_id,
//         alias,                       // <-- added
//         thread_id: r.thread_id,
//         state: r.state,
//         role: r.role,
//         requested:
//           r?.by_format?.pres_request?.dif?.presentation_definition?.input_descriptors || [],
//         suggested_record_ids: suggested,
//         challenge,
//         domain,
//       });
//     }

//     res.json({ peer, total: results.length, results });
//   } catch (e) {
//     next(e);
//   }
// });

router.get('/proofs/inbox', async (req: any, res, next) => {
  try {
    const { peer, c } = ctx(req);
    requireRole(peer, 'holder');

    // New: optional filters
    const qConn  = (req.query.connection_id ?? '').toString().trim();
    const qAlias = (req.query.alias ?? '').toString().trim().toLowerCase();

    // Map connection_id <-> alias (alias may not be unique)
    const conns = await listConnections(req, peer);
    const aliasByConn: Record<string, string | null> = {};
    const connIdsByAlias: Record<string, string[]> = {};
    for (const conn of conns || []) {
      const id = conn?.connection_id;
      if (!id) continue;
      const alias = conn?.alias ?? conn?.their_label ?? null;
      aliasByConn[id] = alias;
      if (alias) {
        const key = String(alias).toLowerCase();
        (connIdsByAlias[key] ||= []).push(id);
      }
    }

    // Build allowed connection-id set from filters (AND if both provided)
    const byConn  = qConn  ? new Set<string>([qConn]) : null;
    const byAlias = qAlias ? new Set<string>(connIdsByAlias[qAlias] || []) : null;
    let allowedConnIds: Set<string> | null = null;
    if (byConn && byAlias) {
      allowedConnIds = new Set([...byConn].filter(id => byAlias.has(id)));
    } else {
      allowedConnIds = byConn || byAlias; // null means "no filter"
    }

    // Fetch all (keep your call) — or pass params if you want ACA-Py to prefilter
    const { data } = await c.get('/present-proof-2.0/records'/*, qConn ? { params: { connection_id: qConn } } : undefined*/);
    let records = (data?.results || []).filter((r: any) => r.state === 'request-received');

    if (allowedConnIds) {
      records = records.filter((r: any) => allowedConnIds!.has(r.connection_id));
    }

    const results: any[] = [];
    for (const r of records) {
      const pres_ex_id = r.pres_ex_id || r.presentation_exchange_id || r._id;

      const { data: cands } = await c.get(`/present-proof-2.0/records/${encodeURIComponent(pres_ex_id)}/credentials`);
      const norm = (cands || []).map((c: any) => ({
        record_id: c.record_id,
        issuanceDate: c.issuanceDate,
        __created: c.proof?.created,
      }));
      const suggested = norm.length === 1 ? [norm[0].record_id] : pickRecordIds(norm);

      const difOptions =
        r?.by_format?.pres_request?.dif?.options
        || r?.pres_request?.dif?.options
        || r?.presentation_request_dict?.dif?.options
        || {};
      const challenge = difOptions.challenge ?? null;
      const domain    = difOptions.domain ?? null;

      const connection_id = r.connection_id;
      const verifier_alias = aliasByConn[connection_id] ?? null;

      results.push({
        pres_ex_id,
        connection_id,
        verifier_alias,                 // already included in your code
        thread_id: r.thread_id,
        state: r.state,
        role: r.role,
        requested: r?.by_format?.pres_request?.dif?.presentation_definition?.input_descriptors || [],
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


// router.get('/proofs/records', async (req: any, res, next) => {
//   try {
//     const { peer, c } = ctx(req);

//     const { state } = req.query as { state?: string };
//     const qConn  = (req.query.connection_id ?? '').toString().trim();
//     const qAlias = (req.query.alias ?? '').toString().trim().toLowerCase();

//     // Build maps: connection_id -> alias and alias -> [connection_ids]
//     const conns = await listConnections(req, peer, 100, 0, c);  // reuse same tenant client
//     const aliasByConn: Record<string, string | null> = {};
//     const connIdsByAlias: Record<string, string[]> = {};

//     for (const conn of conns || []) {
//       const id = conn?.connection_id;
//       if (!id) continue;
//       const alias = conn?.alias ?? conn?.their_label ?? null;
//       aliasByConn[id] = alias;
//       if (alias) {
//         const key = String(alias).toLowerCase();
//         (connIdsByAlias[key] ||= []).push(id);
//       }
//     }

//     // Allowed connection set based on filters (AND if both provided)
//     const byConn  = qConn  ? new Set<string>([qConn]) : null;
//     const byAlias = qAlias ? new Set<string>(connIdsByAlias[qAlias] || []) : null;
//     let allowedConnIds: Set<string> | null = null;
//     if (byConn && byAlias) {
//       allowedConnIds = new Set([...byConn].filter(id => byAlias.has(id)));
//     } else {
//       allowedConnIds = byConn || byAlias; // null => no filtering
//     }

//     // Fetch & optionally filter by state
//     const records = await listProofEx(req, peer);
//     let filtered = state
//       ? records.filter((r: any) => r?.state === String(state))
//       : records;

//     // Filter by alias/connection if provided
//     if (allowedConnIds) {
//       filtered = filtered.filter((r: any) => allowedConnIds!.has(r.connection_id));
//     }

//     const detailed = await Promise.all(
//       filtered.map(async (r: any) => {
//         let consentId: string | null = extractConsentIdAny(r);
//         let abandoned_reason: string | null = null;

//         // Start with requested/challenge/domain from the list record
//         let requested =
//           r?.by_format?.pres_request?.dif?.presentation_definition?.input_descriptors ||
//           r?.pres_request?.dif?.presentation_definition?.input_descriptors ||
//           r?.presentation_request_dict?.dif?.presentation_definition?.input_descriptors ||
//           [];

//         let difOptions =
//           r?.by_format?.pres_request?.dif?.options ||
//           r?.pres_request?.dif?.options ||
//           r?.presentation_request_dict?.dif?.options ||
//           {};

//         let challenge: string | null = difOptions.challenge ?? null;
//         let domain: string | null = difOptions.domain ?? null;

//         const presId = r.pres_ex_id || r.presentation_exchange_id || r._id;

//         // Decide if we need the full record
//         const needFull =
//           !consentId ||
//           r?.state === 'abandoned' ||
//           !requested?.length ||
//           !challenge ||
//           !domain;

//         if (needFull) {
//           try {
//             const { data: rec } = await c.get(
//               `/present-proof-2.0/records/${encodeURIComponent(presId)}`
//             );

//             if (!consentId) {
//               consentId = extractConsentIdAny(rec);
//             }
//             if (r?.state === 'abandoned') {
//               const pr = extractProblemReportAny(rec);
//               abandoned_reason = pr?.reason ?? null;
//             }

//             if (!requested?.length) {
//               requested =
//                 rec?.by_format?.pres_request?.dif?.presentation_definition?.input_descriptors ||
//                 rec?.pres_request?.dif?.presentation_definition?.input_descriptors ||
//                 rec?.presentation_request_dict?.dif?.presentation_definition?.input_descriptors ||
//                 [];
//             }

//             if (!challenge || !domain) {
//               const recOpts =
//                 rec?.by_format?.pres_request?.dif?.options ||
//                 rec?.pres_request?.dif?.options ||
//                 rec?.presentation_request_dict?.dif?.options ||
//                 {};
//               if (!challenge) challenge = recOpts.challenge ?? null;
//               if (!domain)    domain    = recOpts.domain ?? null;
//             }
//           } catch {
//             // ignore; we still return what we have
//           }
//         }

//         const connection_id = r.connection_id;
//         const alias = aliasByConn[connection_id] ?? null;

//         return {
//           pres_ex_id: presId,
//           connection_id,
//           alias,
//           thread_id: r.thread_id,
//           state: r.state,
//           role: r.role,                 // still 'prover' on holder side
//           verified: extractVerifiedFlag(r),
//           created_at: r.created_at,
//           updated_at: r.updated_at,
//           consentId,
//           abandoned_reason,
//           requested,
//           challenge,
//           domain,
//         };
//       })
//     );

//     res.json({ peer, total: detailed.length, results: detailed });
//   } catch (e) {
//     next(e);
//   }
// });





// POST /agent/proofs/send

// router.post('/proofs/send', async (req: any, res, next) => {
//   try {
//     const { peer, c } = ctx(req);
//     requireRole(peer, 'holder');

//     // const base = getAgentConfig(peer).baseUrl;
//     // const c = clientForReq(req, peer);
//     const body = req.body || {};

//     // pres_ex_id optional; if absent we’ll use the latest request-received
//     let pres_ex_id: string | undefined = body.pres_ex_id;
//     const consentId: string | undefined = body.consentId;

//     // If nothing provided, fall back to the latest request-received
//     if (!pres_ex_id) {
//       // const { data } = await axios.get(`${base}/present-proof-2.0/records`);
//       const { data } = await c.get('/present-proof-2.0/records');
//       const reqs: any[] = (data?.results || []).filter((r: any) => r.state === 'request-received');
//       if (reqs.length === 0) return res.status(404).json({ error: 'No pending proof requests' });

//       const latest = reqs.sort((a, b) =>
//         new Date(b?.updated_at || b?.created_at || 0).getTime() -
//         new Date(a?.updated_at || a?.created_at || 0).getTime()
//       )[0];

//       pres_ex_id = latest.pres_ex_id || latest.presentation_exchange_id || latest._id;
//     }

//     // 1) Read the proof record to know the input_descriptor ids
//     let descriptorIds: string[] = [];
//     try {
//       // const { data: rec } = await axios.get(
//       //   `${base}/present-proof-2.0/records/${encodeURIComponent(pres_ex_id!)}`
//       // );
//       const { data: rec } = await c.get(`/present-proof-2.0/records/${encodeURIComponent(pres_ex_id!)}`);
//       const defs =
//         rec?.by_format?.pres_request?.dif?.presentation_definition?.input_descriptors ||
//         rec?.pres_request?.dif?.presentation_definition?.input_descriptors ||
//         rec?.presentation_request_dict?.dif?.presentation_definition?.input_descriptors ||
//         [];
//       descriptorIds = defs.map((d: any) => d?.id).filter(Boolean);
//     } catch { /* non-fatal */ }

//     // 2) Fetch candidates for this exchange
//     const { data: cands } = await c.get(
//       `/present-proof-2.0/records/${encodeURIComponent(pres_ex_id!)}/credentials`
//     );

//     if (!Array.isArray(cands) || cands.length === 0) {
//       // NEW: tell the verifier why we won't present
//       try {
//         await c.post(
//           `/present-proof-2.0/records/${encodeURIComponent(pres_ex_id!)}/problem-report`,
//           {
//             description: 'No matching credentials for requested constraints',
//             code: 'request_not_satisfiable',
//           }
//         );
//       } catch { /* ignore problem-report failures */ }

//       return res.status(422).json({
//         error: 'no_candidates',
//         reason: 'Proof request requires fields not present in any wallet credential',
//       });
//     }

//     // 3) Normalize (keep the raw candidate so we can inspect multiple shapes)
//     type Candidate = {
//       record_id?: string;
//       issuanceDate?: string;
//       __created?: string;
//       raw?: any;
//     };
//     const norm: Candidate[] = (cands || []).map((c: any) => ({
//       record_id: c?.record_id,
//       issuanceDate: c?.issuanceDate,
//       __created: c?.proof?.created,
//       raw: c
//     }));

//     // 4) Helper to read consentId from several possible shapes
//     const getConsentId = (x: any): string | undefined => {
//       if (!x || typeof x !== 'object') return undefined;
//       if (x.credentialSubject?.consentId) return String(x.credentialSubject.consentId);                    // top-level VC (your case)
//       if (x.cred_value?.credentialSubject?.consentId) return String(x.cred_value.credentialSubject.consentId);
//       if (x.credential?.credentialSubject?.consentId) return String(x.credential.credentialSubject.consentId);
//       if (x.attrs?.consentId) return String(x.attrs.consentId);                                           // name/value map
//       return undefined;
//     };

//     // 5) Filter by consentId (if provided). Otherwise, keep all.
//     let filtered = norm;
//     if (consentId) {
//       filtered = norm.filter(n => getConsentId(n.raw) === String(consentId));
//       if (filtered.length === 0) {
//         return res.status(404).json({
//           error: 'no_matching_credentials_for_consentId',
//           message: `No credential in wallet has credentialSubject.consentId="${consentId}".`
//         });
//       }
//     }

//     // 6) Pick one record_id (newest issuance first; fall back to created)
//     const pickedIds = filtered.length === 1 ? [filtered[0].record_id!] : pickRecordIds(filtered as any);
//     if (!pickedIds || pickedIds.length === 0) {
//       return res.status(422).json({ error: 'No suitable credentials found for this proof request' });
//     }

//     // 7) Build DIF payload:
//     //    Prefer descriptor-keyed mapping when we know the descriptor id.
//     let difPayload: any;
//     if (descriptorIds.length === 1) {
//       difPayload = { record_ids: { [descriptorIds[0]]: pickedIds } };
//     } else if (descriptorIds.length > 1) {
//       return res.status(400).json({
//         error: 'record_ids_required_for_multiple_descriptors',
//         message: 'Multiple input_descriptors present; provide record_ids as { descriptorId: [ids] }.'
//       });
//     } else {
//       // Some deployments accept the simple array for single-descriptor PDs
//       difPayload = { record_ids: pickedIds };
//     }

//     // Do NOT include options (challenge/domain). ACA-Py already has them on the exchange.
//     const payload = { dif: difPayload };

//     // const { data: sent } = await axios.post(
//     //   `${base}/present-proof-2.0/records/${encodeURIComponent(pres_ex_id!)}/send-presentation`,
//     //   payload
//     // );
//     const { data: sent } = await c.post(`/present-proof-2.0/records/${encodeURIComponent(pres_ex_id!)}/send-presentation`, payload);

//     return res.json({
//       peer,
//       pres_ex_id,
//       used_descriptor_id: descriptorIds[0] ?? null,
//       used_record_id: pickedIds[0],
//       used_consentId: consentId ?? null,
//       result: sent
//     });
//   } catch (e: any) {
//     const status = e?.response?.status || 500;
//     const details = e?.response?.data || e?.message || 'ACA-Py error';
//     return res.status(status).json({ error: 'ACA-Py error', status, details });
//   }
// });
// router.post('/proofs/send', async (req: any, res, next) => {
//   try {
//     const { peer, c } = ctx(req);
//     requireRole(peer, 'holder');

//     const body = req.body || {};

//     // pres_ex_id optional; if absent we’ll use the latest request-received
//     let pres_ex_id: string | undefined = body.pres_ex_id;
//     const consentId: string | undefined = body.consentId;
//     const alias: string | undefined = body.alias;
//     // If nothing provided, fall back to the latest request-received
//     let connection_id_filter: string | undefined;
//     let resolvedAlias: string | undefined;
//     if (!pres_ex_id) {
//       if (alias) {
//         // STRICT alias resolution
//         const { data: connList } = await c.get('/connections');
//         const hit = (connList?.results || []).find((r: any) => r?.alias === alias);
//         if (!hit) return res.status(404).json({ error: 'alias_not_found', alias });
//         connection_id_filter = hit.connection_id;
//         resolvedAlias = hit.alias;
//       }

//       const { data } = await c.get('/present-proof-2.0/records');
//       const reqs: any[] = (data?.results || []).filter((r: any) =>
//         r.state === 'request-received' &&
//         (!connection_id_filter || r.connection_id === connection_id_filter)
//       );
//       if (reqs.length === 0) return res.status(404).json({ error: 'No pending proof requests' });

//       const latest = reqs.sort((a, b) =>
//         new Date(b?.updated_at || b?.created_at || 0).getTime() -
//         new Date(a?.updated_at || a?.created_at || 0).getTime()
//       )[0];
//       pres_ex_id = latest.pres_ex_id || latest.presentation_exchange_id || latest._id;

//     } else if (alias) {
//       // Optional: sanity check if caller provided both alias and pres_ex_id
//       const { data: rec } = await c.get(`/present-proof-2.0/records/${encodeURIComponent(pres_ex_id)}`);
//       const { data: connList } = await c.get('/connections');
//       const hit = (connList?.results || []).find((r: any) => r?.alias === alias);
//       if (!hit) return res.status(404).json({ error: 'alias_not_found', alias });
//       if (rec?.connection_id && rec.connection_id !== hit.connection_id) {
//         return res.status(409).json({
//           error: 'pres_ex_id_alias_mismatch',
//           pres_ex_id,
//           provided_alias: alias,
//           expected_connection_id: rec?.connection_id,
//           alias_connection_id: hit.connection_id
//         });
//       }
//       resolvedAlias = hit.alias;
//     }
//       // after you resolve `pres_ex_id` (and optional alias checks) but BEFORE reading candidates:
//       if (body.deny === true) {
//         const description = String(body.reason || 'holder_denied_request');
//         const code = 'request_denied';

//         // 1) send a problem report -> pushes the exchange to "abandoned"
//         await c.post(
//           `/present-proof-2.0/records/${encodeURIComponent(pres_ex_id!)}/problem-report`,
//           { description, code }
//         );
//         let removed = false;
//         // (optional) remove the record
//         if (body.remove === true) {
//           try {
//             await c.delete(`/present-proof-2.0/records/${encodeURIComponent(pres_ex_id!)}`);
//             removed = true;
//           } catch { /* ignore; removal is best-effort */ }
//         }

//         // Return current exchange snapshot if you want
//         let rec: any = null;
//         try {
//           const { data } = await c.get(`/present-proof-2.0/records/${encodeURIComponent(pres_ex_id!)}`);
//           rec = {
//             pres_ex_id: data?.pres_ex_id || data?.presentation_exchange_id || pres_ex_id,
//             state: data?.state,
//             role: data?.role,
//             connection_id: data?.connection_id,
//             updated_at: data?.updated_at,
//           };
//         } catch { /* non-fatal */ }

//         return res.json({
//           peer,
//           pres_ex_id,
//           denied: true,
//           reason: description,
//           removed: !!body.remove,
//           record: rec
//         });
//       }

//     // 1) Read the proof record to know descriptor ids AND required items (NEW)
//     let descriptorIds: string[] = [];
//     let requiredItems: string[] = []; // NEW
//     try {
//       const { data: rec } = await c.get(`/present-proof-2.0/records/${encodeURIComponent(pres_ex_id!)}`);
//       const defs =
//         rec?.by_format?.pres_request?.dif?.presentation_definition?.input_descriptors ||
//         rec?.pres_request?.dif?.presentation_definition?.input_descriptors ||
//         rec?.presentation_request_dict?.dif?.presentation_definition?.input_descriptors ||
//         [];
//       descriptorIds = defs.map((d: any) => d?.id).filter(Boolean);

//       // NEW: extract required items from PD (multiple 'fields' with const on consentedItems)
//       const fields = (Array.isArray(defs) && defs[0]?.constraints?.fields) || [];
//       requiredItems = fields
//         .filter((f: any) =>
//           Array.isArray(f?.path) &&
//           f.path.includes('$.credentialSubject.consentedItems[*]') &&
//           f?.filter?.const != null
//         )
//         .map((f: any) => String(f.filter.const).trim().toLowerCase());
//     } catch { /* non-fatal */ }

//     // 2) Fetch candidates for this exchange
//     const { data: cands } = await c.get(`/present-proof-2.0/records/${encodeURIComponent(pres_ex_id!)}/credentials`);
//     if (!Array.isArray(cands) || cands.length === 0) {
//       return res.status(422).json({
//         error: 'no_candidates',
//         reason: 'Proof request requires fields not present in any wallet credential'
//       });
//     }

//     // 3) Normalize (keep raw for inspection)
//     type Candidate = { record_id?: string; issuanceDate?: string; __created?: string; raw?: any; };
//     const norm: Candidate[] = (cands || []).map((c: any) => ({
//       record_id: c?.record_id,
//       issuanceDate: c?.issuanceDate,
//       __created: c?.proof?.created,
//       raw: c
//     }));

//     // 4) Helper inline: read consentId from several shapes (kept inline, not global)
//     const getConsentId = (x: any): string | undefined => {
//       if (!x || typeof x !== 'object') return undefined;
//       if (x.credentialSubject?.consentId) return String(x.credentialSubject.consentId);
//       if (x.cred_value?.credentialSubject?.consentId) return String(x.cred_value.credentialSubject.consentId);
//       if (x.credential?.credentialSubject?.consentId) return String(x.credential.credentialSubject.consentId);
//       if (x.attrs?.consentId) return String(x.attrs.consentId);
//       return undefined;
//     };

//     // 5) Filter by consentId (if provided)
//     let filtered = norm;
//     if (consentId) {
//       filtered = norm.filter(n => getConsentId(n.raw) === String(consentId));
//       if (filtered.length === 0) {
//         return res.status(404).json({
//           error: 'no_matching_credentials_for_consentId',
//           message: `No credential in wallet has credentialSubject.consentId="${consentId}".`
//         });
//       }
//     }

//     // 6) NEW: ensure candidate includes ALL required items from PD
//     if (requiredItems.length) {
//       const includesAll = (raw: any): boolean => {
//         const cs =
//           raw?.credential?.credentialSubject ??
//           raw?.cred_value?.credentialSubject ??
//           raw?.credentialSubject ??
//           {};
//         const have = Array.isArray(cs.consentedItems)
//           ? cs.consentedItems.map((s: any) => String(s).trim().toLowerCase())
//           : [];
//         return requiredItems.every((x: string) => have.includes(x));
//       };

//       filtered = filtered.filter((n) => includesAll(n.raw));
//       if (filtered.length === 0) {
//         // File a problem-report and bail
//         try {
//           await c.post(
//             `/present-proof-2.0/records/${encodeURIComponent(pres_ex_id!)}/problem-report`,
//             {
//               description: `No wallet credential contains all required consentedItems: ${requiredItems.join(', ')}`,
//               code: 'request_not_satisfiable'
//             }
//           );
//         } catch { /* ignore */ }

//         return res.status(422).json({
//           error: 'no_satisfying_candidates',
//           reason: 'No credential contains all required consentedItems requested by the PD.',
//           requiredItems
//         });
//       }
//     }

//     // 7) Pick one record_id (newest issuance first; fall back to created)
//     const pickedIds = filtered.length === 1 ? [filtered[0].record_id!] : pickRecordIds(filtered as any);
//     if (!pickedIds || pickedIds.length === 0) {
//       return res.status(422).json({ error: 'No suitable credentials found for this proof request' });
//     }

//     // 8) Build DIF payload (prefer descriptor-keyed mapping when we know the descriptor id)
//     let difPayload: any;
//     if (descriptorIds.length === 1) {
//       difPayload = { record_ids: { [descriptorIds[0]]: pickedIds } };
//     } else if (descriptorIds.length > 1) {
//       return res.status(400).json({
//         error: 'record_ids_required_for_multiple_descriptors',
//         message: 'Multiple input_descriptors present; provide record_ids as { descriptorId: [ids] }.'
//       });
//     } else {
//       difPayload = { record_ids: pickedIds };
//     }
//     const chosen = filtered.find(n => n.record_id === pickedIds[0]);
//     const chosenConsentId = consentId ?? getConsentId(chosen?.raw) ?? null;
//     // Send (ACA-Py already has challenge/domain on the exchange)
//     const payload = { dif: difPayload };
//     const { data: sent } = await c.post(
//       `/present-proof-2.0/records/${encodeURIComponent(pres_ex_id!)}/send-presentation`,
//       payload
//     );

//     return res.json({
//       peer,
//       pres_ex_id,
//       used_descriptor_id: descriptorIds[0] ?? null,
//       used_record_id: pickedIds[0],
//       used_consentId: chosenConsentId ?? null,
//       resolved_alias: resolvedAlias ?? null,
//       resolved_connection_id: connection_id_filter ?? null,
//       result: sent
//     });
//   } catch (e: any) {
//     const status = e?.response?.status || 500;
//     const details = e?.response?.data || e?.message || 'ACA-Py error';
//     return res.status(status).json({ error: 'ACA-Py error', status, details });
//   }
// });
router.post('/proofs/send', async (req: any, res, next) => {
  try {
    const { peer, c } = ctx(req);
    requireRole(peer, 'holder');

    const body = req.body || {};

    // pres_ex_id optional; if absent we’ll use the latest request-received
    let pres_ex_id: string | undefined =
      body.pres_ex_id ?? body.presExId ?? body.requestId;

    const consentId: string | undefined = body.consentId;
    const verifier_alias: string | undefined = body.verifier_alias;

    // If nothing provided, fall back to the latest request-received
    let connection_id_filter: string | undefined;
    let resolvedAlias: string | undefined;

    if (!pres_ex_id) {
      if (verifier_alias) {
        // STRICT alias resolution
        const { data: connList } = await c.get('/connections');
        const hit = (connList?.results || []).find((r: any) => r?.alias === verifier_alias);
        if (!hit) return res.status(404).json({ error: 'alias_not_found', alias: verifier_alias });
        connection_id_filter = hit.connection_id;
        resolvedAlias = hit.alias;
      }

      const { data } = await c.get('/present-proof-2.0/records');
      const reqs: any[] = (data?.results || []).filter((r: any) =>
        r.state === 'request-received' &&
        (!connection_id_filter || r.connection_id === connection_id_filter)
      );
      if (reqs.length === 0) return res.status(404).json({ error: 'No pending proof requests' });

      const latest = reqs.sort((a, b) =>
        new Date(b?.updated_at || b?.created_at || 0).getTime() -
        new Date(a?.updated_at || a?.created_at || 0).getTime()
      )[0];
      pres_ex_id = latest.pres_ex_id || latest.presentation_exchange_id || latest._id;

    } else {
      // pres_ex_id is globally unique; skip alias validation.
      // Optionally fetch to return alias in response (best-effort only).
      try {
        const { data: rec } = await c.get(`/present-proof-2.0/records/${encodeURIComponent(pres_ex_id)}`);
        resolvedAlias = rec?.alias || null;
      } catch { /* ignore */ }
    }

    // ---- Deny path (B) ----
    const toBool = (v: any) => (typeof v === 'string' ? v.toLowerCase() === 'true' : !!v);
    if (toBool(body.deny)) {
      const description = String(body.reason || 'holder_denied_request');
      const code = 'request_denied';

      await c.post(
        `/present-proof-2.0/records/${encodeURIComponent(pres_ex_id!)}/problem-report`,
        { description, code }
      );

      let removed = false;
      if (toBool(body.remove)) {
        try {
          await c.delete(`/present-proof-2.0/records/${encodeURIComponent(pres_ex_id!)}`);
          removed = true;
        } catch { /* best effort */ }
      }

      let rec: any = null;
      try {
        const { data } = await c.get(`/present-proof-2.0/records/${encodeURIComponent(pres_ex_id!)}`);
        rec = {
          pres_ex_id: data?.pres_ex_id || data?.presentation_exchange_id || pres_ex_id,
          state: data?.state,
          role: data?.role,
          connection_id: data?.connection_id,
          updated_at: data?.updated_at,
        };
      } catch { /* non-fatal */ }

      return res.json({
        peer,
        pres_ex_id,
        denied: true,
        reason: description,
        removed,
        record: rec
      });
    }

    // 1) Read the proof record to know descriptor ids AND required items (keep original behavior)
    let descriptorIds: string[] = [];
    let requiredItems: string[] = []; // NEW in your original, but keep same extraction style
    try {
      const { data: rec } = await c.get(`/present-proof-2.0/records/${encodeURIComponent(pres_ex_id!)}`);
      const defs =
        rec?.by_format?.pres_request?.dif?.presentation_definition?.input_descriptors ||
        rec?.pres_request?.dif?.presentation_definition?.input_descriptors ||
        rec?.presentation_request_dict?.dif?.presentation_definition?.input_descriptors ||
        [];
      descriptorIds = defs.map((d: any) => d?.id).filter(Boolean);

      const fields = (Array.isArray(defs) && defs[0]?.constraints?.fields) || [];
      requiredItems = fields
        .filter((f: any) =>
          Array.isArray(f?.path) &&
          f.path.includes('$.credentialSubject.consentedItems[*]') &&
          f?.filter?.const != null
        )
        .map((f: any) => String(f.filter.const).trim().toLowerCase());
    } catch { /* non-fatal */ }

    // 2) Fetch candidates for this exchange
    const { data: cands } = await c.get(`/present-proof-2.0/records/${encodeURIComponent(pres_ex_id!)}/credentials`);
    if (!Array.isArray(cands) || cands.length === 0) {
      return res.status(422).json({
        error: 'no_candidates',
        reason: 'Proof request requires fields not present in any wallet credential'
      });
    }

    // 3) Normalize (keep raw for inspection)
    type Candidate = { record_id?: string; issuanceDate?: string; __created?: string; raw?: any; };
    const norm: Candidate[] = (cands || []).map((c: any) => ({
      record_id: c?.record_id,
      issuanceDate: c?.issuanceDate,
      __created: c?.proof?.created,
      raw: c
    }));

    // 4) Helper inline: read consentId from several shapes
    const getConsentId = (x: any): string | undefined => {
      if (!x || typeof x !== 'object') return undefined;
      if (x.credentialSubject?.consentId) return String(x.credentialSubject.consentId);
      if (x.cred_value?.credentialSubject?.consentId) return String(x.cred_value.credentialSubject.consentId);
      if (x.credential?.credentialSubject?.consentId) return String(x.credential.credentialSubject.consentId);
      if (x.attrs?.consentId) return String(x.attrs.consentId);
      return undefined;
    };

    // 5) Filter by consentId (if provided)
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

    // 6) Ensure candidate includes ALL required items from PD (keep original logic)
    if (requiredItems.length) {
      const includesAll = (raw: any): boolean => {
        const cs =
          raw?.credential?.credentialSubject ??
          raw?.cred_value?.credentialSubject ??
          raw?.credentialSubject ??
          {};
        const have = Array.isArray(cs.consentedItems)
          ? cs.consentedItems.map((s: any) => String(s).trim().toLowerCase())
          : [];
        return requiredItems.every((x: string) => have.includes(x));
      };

      filtered = filtered.filter((n) => includesAll(n.raw));
      if (filtered.length === 0) {
        try {
          await c.post(
            `/present-proof-2.0/records/${encodeURIComponent(pres_ex_id!)}/problem-report`,
            {
              description: `No wallet credential contains all required consentedItems: ${requiredItems.join(', ')}`,
              code: 'request_not_satisfiable'
            }
          );
        } catch { /* ignore */ }

        return res.status(422).json({
          error: 'no_satisfying_candidates',
          reason: 'No credential contains all required consentedItems requested by the PD.',
          requiredItems
        });
      }
    }

    // 7) Pick one record_id (newest issuance first; fall back to created)
    const pickedIds = filtered.length === 1 ? [filtered[0].record_id!] : pickRecordIds(filtered as any);
    if (!pickedIds || pickedIds.length === 0) {
      return res.status(422).json({ error: 'No suitable credentials found for this proof request' });
    }

    // 8) Build DIF payload (prefer descriptor-keyed mapping when we know the descriptor id)
    let difPayload: any;
    if (descriptorIds.length === 1) {
      difPayload = { record_ids: { [descriptorIds[0]]: pickedIds } };
    } else if (descriptorIds.length > 1) {
      return res.status(400).json({
        error: 'record_ids_required_for_multiple_descriptors',
        message: 'Multiple input_descriptors present; provide record_ids as { descriptorId: [ids] }.'
      });
    } else {
      difPayload = { record_ids: pickedIds };
    }
    const chosen = filtered.find(n => n.record_id === pickedIds[0]);
    const chosenConsentId = consentId ?? getConsentId(chosen?.raw) ?? null;

    const payload = { dif: difPayload };
    const { data: sent } = await c.post(
      `/present-proof-2.0/records/${encodeURIComponent(pres_ex_id!)}/send-presentation`,
      payload
    );

    return res.json({
      peer,
      pres_ex_id,
      used_descriptor_id: descriptorIds[0] ?? null,
      used_record_id: pickedIds[0],
      used_consentId: chosenConsentId ?? null,
      resolved_alias: resolvedAlias ?? null,
      resolved_connection_id: connection_id_filter ?? null,
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


// router.get('/proofs/records', async (req: any, res, next) => {
//   try {
//     const { peer, c } = ctx(req);
//     requireRole(peer, 'verifier');

//     const { state } = req.query as { state?: string };
//     const records = await listProofEx(req, peer);
//     const filtered = state ? records.filter((r: any) => r?.state === String(state)) : records;

//     // build a map of connection_id -> alias (fallback to their_label)
//     const conns = await listConnections(req, peer);
//     const aliasByConn: Record<string, string | null> = {};
//     for (const c of conns || []) {
//       const id = c?.connection_id;
//       if (id) aliasByConn[id] = c?.alias ?? c?.their_label ?? null;
//     }

//     //const base = getAgentConfig(peer).baseUrl;
//     // const c = clientForReq(req, peer);

//     const detailed = await Promise.all(
//       filtered.map(async (r: any) => {
//         // try to extract directly from list item first
//         let consentId: string | null = extractConsentIdAny(r);

//         // if not present, fetch record detail and try again
//         if (!consentId) {
//           const id = r.pres_ex_id || r.presentation_exchange_id || r._id;
//           try {
//             //const { data: rec } = await axios.get(
//             //  `${base}/present-proof-2.0/records/${encodeURIComponent(id)}`
//             //);
//             const {  data: rec  } = await c.get(`/present-proof-2.0/records/${encodeURIComponent(id)}`);
//             consentId = extractConsentIdAny(rec);
//           } catch {
//             // ignore; leave as null
//           }
//         }

//         const connection_id = r.connection_id;
//         const alias = aliasByConn[connection_id] ?? null;

//         return {
//           pres_ex_id: r.pres_ex_id,
//           connection_id,
//           alias,                       
//           thread_id: r.thread_id,
//           state: r.state,
//           role: r.role,
//           verified: r.verified ?? r?.by_format?.pres?.dif?.verified ?? undefined,
//           created_at: r.created_at,
//           updated_at: r.updated_at,
//           consentId,                  
//         };
//       })
//     );

//     res.json({ peer, total: detailed.length, results: detailed });
//   } catch (e) {
//     next(e);
//   }
// });




//verifier: verify presentation consent validity
// --- helpers to parse DIF presentation shapes (reuse your earlier helpers style) ---

// router.get('/proofs/records', async (req: any, res, next) => {
//   try {
//     const { peer, c } = ctx(req);
//     //requireRole(peer, 'verifier');

//     // Optional filters
//     const { state } = req.query as { state?: string };
//     const qConn  = (req.query.connection_id ?? '').toString().trim();
//     const qAlias = (req.query.alias ?? '').toString().trim().toLowerCase();

//     // Build maps: connection_id -> alias and alias -> [connection_ids]
//     const conns = await listConnections(req, peer);
//     const aliasByConn: Record<string, string | null> = {};
//     const connIdsByAlias: Record<string, string[]> = {};
//     for (const conn of conns || []) {
//       const id = conn?.connection_id;
//       if (!id) continue;
//       const alias = conn?.alias ?? conn?.their_label ?? null;
//       aliasByConn[id] = alias;
//       if (alias) {
//         const key = String(alias).toLowerCase();
//         (connIdsByAlias[key] ||= []).push(id);
//       }
//     }

//     // Allowed connection set based on filters (AND if both provided)
//     const byConn  = qConn  ? new Set<string>([qConn]) : null;
//     const byAlias = qAlias ? new Set<string>(connIdsByAlias[qAlias] || []) : null;
//     let allowedConnIds: Set<string> | null = null;
//     if (byConn && byAlias) {
//       allowedConnIds = new Set([...byConn].filter(id => byAlias.has(id)));
//     } else {
//       allowedConnIds = byConn || byAlias; // null => no filtering
//     }

//     // Fetch & filter by state
//     const records = await listProofEx(req, peer);
//     let filtered = state ? records.filter((r: any) => r?.state === String(state)) : records;

//     // Filter by alias/connection if provided
//     if (allowedConnIds) {
//       filtered = filtered.filter((r: any) => allowedConnIds!.has(r.connection_id));
//     }

//     // Build detailed rows
//    // Build detailed rows
//     const detailed = await Promise.all(
//       filtered.map(async (r: any) => {
//         let consentId: string | null = extractConsentIdAny(r);
//         let abandoned_reason: string | null = null;
       
//         if (!consentId || r?.state === 'abandoned') {
//           const id = r.pres_ex_id || r.presentation_exchange_id || r._id;
//           try {
//             const { data: rec } = await c.get(`/present-proof-2.0/records/${encodeURIComponent(id)}`);
//             if (!consentId) consentId = extractConsentIdAny(rec);
//             if (r?.state === 'abandoned') {
//               const pr = extractProblemReportAny(rec);
//               abandoned_reason = pr.reason;
//             }
//           } catch { /* ignore */ }
//         }

//         const connection_id = r.connection_id;
//         const alias = aliasByConn[connection_id] ?? null;

//         return {
//           pres_ex_id: r.pres_ex_id || r.presentation_exchange_id || r._id,
//           connection_id,
//           alias,
//           thread_id: r.thread_id,
//           state: r.state,
//           role: r.role,
//           verified: extractVerifiedFlag(r),
//           created_at: r.created_at,
//           updated_at: r.updated_at,
//           consentId,
//           // NEW (only populated when state==='abandoned')
//           abandoned_reason
//         };
//       })
//     );


//     res.json({ peer, total: detailed.length, results: detailed });
//   } catch (e) {
//     next(e);
//   }
// });

// router.get('/proofs/records', async (req: any, res, next) => {
//   try {
//     const { peer, c } = ctx(req);

//     const { state } = req.query as { state?: string };
//     const qConn  = (req.query.connection_id ?? '').toString().trim();
//     const qAlias = ( req.query.contact_alias ?? req.query.alias ?? '').toString().trim().toLowerCase();

//     // Build maps: connection_id -> alias and alias -> [connection_ids]
//     const conns = await listConnections(req, peer, 100, 0, c);  // <-- pass c here
//     const aliasByConn: Record<string, string | null> = {};
//     const connIdsByAlias: Record<string, string[]> = {};
//     for (const conn of conns || []) {
//       const id = conn?.connection_id;
//       if (!id) continue;
//       const alias = conn?.alias ?? conn?.their_label ?? null;
//       aliasByConn[id] = alias;
//       if (alias) {
//         const key = String(alias).toLowerCase();
//         (connIdsByAlias[key] ||= []).push(id);
//       }
//     }

//     // ...rest of your route unchanged...


//     // Allowed connection set based on filters (AND if both provided)
//     const byConn  = qConn  ? new Set<string>([qConn]) : null;
//     const byAlias = qAlias ? new Set<string>(connIdsByAlias[qAlias] || []) : null;
//     let allowedConnIds: Set<string> | null = null;
//     if (byConn && byAlias) {
//       allowedConnIds = new Set([...byConn].filter(id => byAlias.has(id)));
//     } else {
//       allowedConnIds = byConn || byAlias; // null => no filtering
//     }

//     // Fetch & filter by state
//     const records = await listProofEx(req, peer);
//     let filtered = state ? records.filter((r: any) => r?.state === String(state)) : records;

//     // Filter by alias/connection if provided
//     if (allowedConnIds) {
//       filtered = filtered.filter((r: any) => allowedConnIds!.has(r.connection_id));
//     }

//     // Build detailed rows
//    // Build detailed rows
//     const detailed = await Promise.all(
//       filtered.map(async (r: any) => {
//         let consentId: string | null = extractConsentIdAny(r);
//         let abandoned_reason: string | null = null;
       
//         if (!consentId || r?.state === 'abandoned') {
//           const id = r.pres_ex_id || r.presentation_exchange_id || r._id;
//           try {
//             const { data: rec } = await c.get(`/present-proof-2.0/records/${encodeURIComponent(id)}`);
//             if (!consentId) consentId = extractConsentIdAny(rec);
//             if (r?.state === 'abandoned') {
//               const pr = extractProblemReportAny(rec);
//               abandoned_reason = pr.reason;
//             }
//           } catch { /* ignore */ }
//         }

//         const connection_id = r.connection_id;
//         const alias = aliasByConn[connection_id] ?? null;

//         return {
//           pres_ex_id: r.pres_ex_id || r.presentation_exchange_id || r._id,
//           connection_id,
//           alias,
//           thread_id: r.thread_id,
//           state: r.state,
//           role: r.role,
//           verified: extractVerifiedFlag(r),
//           created_at: r.created_at,
//           updated_at: r.updated_at,
//           consentId,
//           // NEW (only populated when state==='abandoned')
//           abandoned_reason
//         };
//       })
//     );


//     res.json({ peer, total: detailed.length, results: detailed });
//   } catch (e) {
//     next(e);
//   }
// });

router.get('/proofs/records', async (req: any, res, next) => {
  try {
    const { peer, c } = ctx(req);

    const { state } = req.query as { state?: string };

    const qConn  = (req.query.connection_id ?? '').toString().trim();
    const qAlias = (
      req.query.contact_alias ??
      req.query.alias ??
      ''
    ).toString().trim().toLowerCase();

    // Build maps: connection_id -> alias and alias -> [connection_ids]
    const conns = await listConnections(req, peer, 100, 0, c);
    const aliasByConn: Record<string, string | null> = {};
    const connIdsByAlias: Record<string, string[]> = {};

    for (const conn of conns || []) {
      const id = conn?.connection_id;
      if (!id) continue;
      const alias = conn?.alias ?? conn?.their_label ?? null;
      aliasByConn[id] = alias;
      if (alias) {
        const key = String(alias).toLowerCase();
        (connIdsByAlias[key] ||= []).push(id);
      }
    }

    // Allowed connection set based on filters (AND if both provided)
    const byConn  = qConn  ? new Set<string>([qConn]) : null;
    const byAlias = qAlias ? new Set<string>(connIdsByAlias[qAlias] || []) : null;
    let allowedConnIds: Set<string> | null = null;

    if (byConn && byAlias) {
      // intersection
      allowedConnIds = new Set([...byConn].filter(id => byAlias.has(id)));
    } else {
      // one or none
      allowedConnIds = byConn || byAlias; // null => no filter
    }

    // Fetch & optionally filter by state
    const records = await listProofEx(req, peer);
    let filtered = state
      ? records.filter((r: any) => r?.state === String(state))
      : records;

    // Filter by alias/connection if provided
    if (allowedConnIds) {
      filtered = filtered.filter((r: any) => allowedConnIds!.has(r.connection_id));
    }

    const detailed = await Promise.all(
      filtered.map(async (r: any) => {
        let consentId: string | null = extractConsentIdAny(r);
        let abandoned_reason: string | null = null;

        // Try to read requested/challenge/domain directly from list record
        let requested =
          r?.by_format?.pres_request?.dif?.presentation_definition?.input_descriptors ||
          r?.pres_request?.dif?.presentation_definition?.input_descriptors ||
          r?.presentation_request_dict?.dif?.presentation_definition?.input_descriptors ||
          [];

        let difOptions =
          r?.by_format?.pres_request?.dif?.options ||
          r?.pres_request?.dif?.options ||
          r?.presentation_request_dict?.dif?.options ||
          {};

        let challenge: string | null = difOptions.challenge ?? null;
        let domain: string | null = difOptions.domain ?? null;

        const presId = r.pres_ex_id || r.presentation_exchange_id || r._id;

        // Decide if we need the full record
        const needFull =
          !consentId ||
          r?.state === 'abandoned' ||
          !requested?.length ||
          !challenge ||
          !domain;

        if (needFull) {
          try {
            const { data: rec } = await c.get(
              `/present-proof-2.0/records/${encodeURIComponent(presId)}`
            );

            if (!consentId) {
              consentId = extractConsentIdAny(rec);
            }
            if (r?.state === 'abandoned') {
              const pr = extractProblemReportAny(rec);
              abandoned_reason = pr?.reason ?? null;
            }

            if (!requested?.length) {
              requested =
                rec?.by_format?.pres_request?.dif?.presentation_definition?.input_descriptors ||
                rec?.pres_request?.dif?.presentation_definition?.input_descriptors ||
                rec?.presentation_request_dict?.dif?.presentation_definition?.input_descriptors ||
                [];
            }

            if (!challenge || !domain) {
              const recOpts =
                rec?.by_format?.pres_request?.dif?.options ||
                rec?.pres_request?.dif?.options ||
                rec?.presentation_request_dict?.dif?.options ||
                {};
              if (!challenge) challenge = recOpts.challenge ?? null;
              if (!domain)    domain    = recOpts.domain ?? null;
            }
          } catch {
            // ignore; return what we have
          }
        }

        const connection_id = r.connection_id;
        const alias = aliasByConn[connection_id] ?? null;

        return {
          pres_ex_id: presId,
          connection_id,
          alias,
          thread_id: r.thread_id,
          state: r.state,
          role: r.role,
          verified: extractVerifiedFlag(r),
          created_at: r.created_at,
          updated_at: r.updated_at,
          consentId,
          abandoned_reason,
          requested,
          challenge,
          domain,
        };
      })
    );

    res.json({ peer, total: detailed.length, results: detailed });
  } catch (e) {
    next(e);
  }
});


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


function extractProblemReportAny(rec: any): { reason: string | null; code: string | null } {
  // Common places ACA-Py stores it for present-proof v2
  const pr = rec?.problem_report || rec?.problem_report_dict || rec?.by_format?.problem_report;
  const code =
    (typeof pr?.code === 'string' && pr.code) ||
    (typeof rec?.problem_code === 'string' && rec.problem_code) ||
    null;

  // v2 often sets error_msg; keep our custom description too
  const reason =
    (typeof pr?.description === 'string' && pr.description) ||
    (typeof rec?.error_msg === 'string' && rec.error_msg) ||
    null;

  return { reason, code };
}


// // --- POST /agent/proofs/verify ---
// router.post('/proofs/verify', async (req: any, res, next) => {
//   try {
//     const { peer, c } = ctx(req);  
//     requireRole(peer, 'verifier');

//     const { consentId, purpose = 'pcode001', operation = 'ocode001' } = req.body || {};
//     if (!consentId) return res.status(400).json({ error: 'consentId is required' });

//     // 1) Find a completed/verified proof exchange that contains this consentId
//     const records = await listProofEx(req, peer);
//     const candidates = records
//       .filter((r: any) => ['done', 'verified', 'presentation-received'].includes(String(r?.state || '')))
//       .sort(sortByRecency);

//     let matched: any | null = null;
//     for (const r of candidates) {
//       const cid = extractConsentIdAny(r);
//       if (cid && String(cid) === String(consentId)) {
//         matched = r;
//         break;
//       }
//     }

//     // if not found in the list view, try fetching details of the latest "done" records to double-check
//     if (!matched) {
//       //const base = getAgentConfig(peer).baseUrl;
//       // const { c } = ctx(req);
//       for (const r of candidates.slice(0, 5)) {
//         const id = r.pres_ex_id || r.presentation_exchange_id || r._id;
//         try {
//           // const { data: rec } = await axios.get(`${base}/present-proof-2.0/records/${encodeURIComponent(id)}`);
//           const { data: rec } = await c.get(`/present-proof-2.0/records/${encodeURIComponent(id)}`);
//           const cid = extractConsentIdAny(rec);
//           if (cid && String(cid) === String(consentId)) {
//             matched = rec;
//             break;
//           }
//         } catch {/* ignore */}
//       }
//     }

//     if (!matched) {
//       return res.status(404).json({ error: 'vp_not_found_for_consentId', message: `No VP found for consentId "${consentId}".` });
//     }

//     const verified = extractVerifiedFlag(matched);
//     if (!verified) {
//       return res.status(409).json({ error: 'vp_not_verified', message: 'Presentation exists but is not verified=true.' });
//     }

//     // 2) Extract issuer DID from the VP and check it on-chain (revocation / existence)
//     const issuerDid =
//       extractIssuerDidAny(matched) ||
//       null;

//     if (!issuerDid) {
//       return res.status(422).json({ error: 'issuer_missing', message: 'Issuer DID not present in VP.' });
//     }

//     // Call local /readDIDkey/:did (reuse auth header for verifyToken)
//     const selfBase = `${req.protocol}://${req.get('host')}`;
//     let didDoc: any = null;

//     try {
//       const { data } = await c.get(
//         `/readDIDkey/${encodeURIComponent(issuerDid)}`,
//       );
//       // Some environments may serialize as string; normalize to object
//       didDoc = typeof data === 'string' ? JSON.parse(data) : data;
//     } catch (e: any) {
//       const status = e?.response?.status || 500;
//       if (status === 404) {
//         return res.status(404).json({
//           error: 'issuer_not_on_chain',
//           message: 'Issuer cannot be verified on-chain.'
//         });
//       }
//       // Don’t bubble as 500 without context—return a clear lookup error
//       return res.status(status).json({
//         error: 'issuer_lookup_failed',
//         message: e?.response?.data?.error || e?.message || 'Failed to retrieve issuer DID from chain'
//       });
//     }

//     // Explicit handling for revoked issuer DID (include when & last tx if present)
//     if (didDoc?.revoked === true) {
//       const when = didDoc?.revokedTimestamp || didDoc?.auditTrail?.find((a: any) => a?.revoked)?.timestamp || null;
//       const txId = didDoc?.auditTrail?.find((a: any) => a?.revoked)?.txId || null;
//       return res.status(409).json({
//         error: 'did_revoked',
//         message: 'Issuer DID is revoked on-chain.',
//         revokedTimestamp: when,
//         revokedTxId: txId
//       });
//     }


//     // 3) Check consent on-chain via /verifyAndLogAccess (expects result: true)
//     try {
//       const { data: ver } = await axios.post(
//         `${selfBase}/verifyAndLogAccess`,
//         {
//           assetId: String(consentId),
//           accessRequest: JSON.stringify({ purpose, operation })
//         },
//         { headers: { authorization: String(req.headers.authorization || '') } }
//       );

//       if (ver?.result === true) {
//         // ✅ everything passed
//         return res.json({
//           active: true,
//           consentId,
//           issuerDid,
//           vp_verified: true,
//           chain: { issuer_revoked: false },
//           consent_check: { result: true, reason: ver?.reason ?? 'ok', validUntil: ver?.validUntil ?? null }
//         });
//       }

//       // Map common failure reasons from your chaincode service
//       const reason = String(ver?.reason || ver?.status || 'unknown');
//       if (/revoked/i.test(reason)) {
//         return res.status(409).json({ error: 'consent_revoked', message: 'Consent is revoked on-chain.', details: ver });
//       }
//       if (/expired/i.test(reason)) {
//         return res.status(409).json({ error: 'expired', message: 'Consent is expired on-chain.', details: ver });
//       }
//       if (/not[_\s-]?found|unknown/i.test(reason)) {
//         return res.status(404).json({ error: 'consent_not_found', message: 'Consent does not exist on-chain.', details: ver });
//       }

//       // generic not-allowed / policy mismatch
//       return res.status(403).json({ error: 'consent_not_allowed', message: 'Consent policy denied access.', details: ver });
//     } catch (e: any) {
//       // bubble up verifier service errors
//       if (e?.response) {
//         const st = e.response.status || 500;
//         return res.status(st).json({ error: 'consent_check_failed', details: e.response.data });
//       }
//       throw e;
//     }
//   } catch (e) {
//     next(e);
//   }
// });




// // --- POST /agent/proofs/verify ---
// router.post('/proofs/verify', async (req: any, res, next) => {
//   try {
//     const { peer, c, authHdr, selfBase } = ctx(req);
//     requireRole(peer, 'verifier');

//     const { consentId, purpose = 'pcode001', operation = 'ocode001' } = req.body || {};
//     if (!consentId) return res.status(400).json({ error: 'consentId is required' });

//     // 1) Find a completed/verified proof exchange that contains this consentId
//     const records = await listProofEx(req, peer);
//     const candidates = records
//       .filter((r: any) => ['done', 'verified', 'presentation-received'].includes(String(r?.state || '')))
//       .sort(sortByRecency);

//     let matched: any | null = null;
//     for (const r of candidates) {
//       const cid = extractConsentIdAny(r);
//       if (cid && String(cid) === String(consentId)) { matched = r; break; }
//     }

//     // Fallback: fetch a few latest records in detail
//     if (!matched) {
//       for (const r of candidates.slice(0, 5)) {
//         const id = r.pres_ex_id || r.presentation_exchange_id || r._id;
//         try {
//           const { data: rec } = await c.get(`/present-proof-2.0/records/${encodeURIComponent(id)}`);
//           const cid = extractConsentIdAny(rec);
//           if (cid && String(cid) === String(consentId)) { matched = rec; break; }
//         } catch { /* ignore */ }
//       }
//     }

//     if (!matched) {
//       return res.status(404).json({ error: 'vp_not_found_for_consentId', message: `No VP found for consentId "${consentId}".` });
//     }

//     const verified = extractVerifiedFlag(matched);
//     if (!verified) {
//       return res.status(409).json({ error: 'vp_not_verified', message: 'Presentation exists but is not verified=true.' });
//     }

//     // 2) Extract issuer DID from the VP and check it on-chain
//     const issuerDid = extractIssuerDidAny(matched) || null;
//     if (!issuerDid) {
//       return res.status(422).json({ error: 'issuer_missing', message: 'Issuer DID not present in VP.' });
//     }

//     // Look up issuer DID on-chain via our own API (forward auth + selected peer)
//     const commonHeaders = { ...authHdr, 'x-selected-peer': String(peer) };
//     let didDoc: any = null;
//     try {
//       const { data } = await axios.get(
//         `${selfBase}/readDIDkey/${encodeURIComponent(issuerDid)}`,
//         { headers: commonHeaders }
//       );
//       didDoc = typeof data === 'string' ? JSON.parse(data) : data;
//     } catch (e: any) {
//       const status = e?.response?.status || 500;
//       if (status === 404) {
//         return res.status(404).json({ error: 'issuer_not_on_chain', message: 'Issuer cannot be verified on-chain.' });
//       }
//       return res.status(status).json({
//         error: 'issuer_lookup_failed',
//         message: e?.response?.data?.error || e?.message || 'Failed to retrieve issuer DID from chain'
//       });
//     }

//     if (didDoc?.revoked === true) {
//       const when = didDoc?.revokedTimestamp || didDoc?.auditTrail?.find((a: any) => a?.revoked)?.timestamp || null;
//       const txId = didDoc?.auditTrail?.find((a: any) => a?.revoked)?.txId || null;
//       return res.status(409).json({
//         error: 'did_revoked',
//         message: 'Issuer DID is revoked on-chain.',
//         revokedTimestamp: when,
//         revokedTxId: txId
//       });
//     }

//     // 3) Check consent on-chain via /verifyAndLogAccess (must forward selected peer!)
//     try {
//       const { data: ver } = await axios.post(
//         `${selfBase}/verifyAndLogAccess`,
//         {
//           assetId: String(consentId),
//           accessRequest: JSON.stringify({ purpose, operation })
//         },
//         { headers: commonHeaders }
//       );

//       if (ver?.result === true) {
//         return res.json({
//           active: true,
//           consentId,
//           issuerDid,
//           vp_verified: true,
//           chain: { issuer_revoked: false },
//           consent_check: {
//             result: true,
//             reason: ver?.reason ?? 'ok',
//             validUntil: ver?.validUntil ?? null
//           }
//         });
//       }

//       const reason = String(ver?.reason || ver?.status || 'unknown');
//       if (/revoked/i.test(reason)) return res.status(409).json({ error: 'consent_revoked', message: 'Consent is revoked on-chain.', details: ver });
//       if (/expired/i.test(reason)) return res.status(409).json({ error: 'expired', message: 'Consent is expired on-chain.', details: ver });
//       if (/not[_\s-]?found|unknown/i.test(reason)) return res.status(404).json({ error: 'consent_not_found', message: 'Consent does not exist on-chain.', details: ver });

//       return res.status(403).json({ error: 'consent_not_allowed', message: 'Consent policy denied access.', details: ver });
//     } catch (e: any) {
//       if (e?.response) {
//         const st = e.response.status || 500;
//         return res.status(st).json({ error: 'consent_check_failed', details: e.response.data });
//       }
//       throw e;
//     }
//   } catch (e) {
//     next(e);
//   }
// });

// --- POST /agent/proofs/verify ---
router.post('/proofs/verify', async (req: any, res, next) => {
  try {
    const { peer, c, authHdr, selfBase } = ctx(req);
    requireRole(peer, 'verifier');

    const { consentId, purpose = 'pcode001', operation = 'ocode001' } = req.body || {};
    if (!consentId) return res.status(400).json({ error: 'consentId is required' });

    // 1) Find a completed/verified proof exchange that contains this consentId
    const records = await listProofEx(req, peer);
    const candidates = records
      .filter((r: any) => ['done', 'verified', 'presentation-received'].includes(String(r?.state || '')))
      .sort(sortByRecency);

    let matched: any | null = null;
    for (const r of candidates) {
      const cid = extractConsentIdAny(r);
      if (cid && String(cid) === String(consentId)) { matched = r; break; }
    }

    // Fallback: fetch a few latest records in detail
    if (!matched) {
      for (const r of candidates.slice(0, 5)) {
        const id = r.pres_ex_id || r.presentation_exchange_id || r._id;
        try {
          const { data: rec } = await c.get(`/present-proof-2.0/records/${encodeURIComponent(id)}`);
          const cid = extractConsentIdAny(rec);
          if (cid && String(cid) === String(consentId)) { matched = rec; break; }
        } catch { /* ignore */ }
      }
    }

    if (!matched) {
      return res.status(404).json({ error: 'vp_not_found_for_consentId', message: `No VP found for consentId "${consentId}".` });
    }

    const verified = extractVerifiedFlag(matched);
    if (!verified) {
      return res.status(409).json({ error: 'vp_not_verified', message: 'Presentation exists but is not verified=true.' });
    }

    // 2) Extract issuer DID from the VP and check it on-chain
    const issuerDid = extractIssuerDidAny(matched) || null;
    if (!issuerDid) {
      return res.status(422).json({ error: 'issuer_missing', message: 'Issuer DID not present in VP.' });
    }

    // Look up issuer DID on-chain via our own API (forward auth + selected peer)
    const commonHeaders = { ...authHdr, 'x-selected-peer': String(peer) };
    let didDoc: any = null;
    try {
      const { data } = await axios.get(
        `${selfBase}/readDIDkey/${encodeURIComponent(issuerDid)}`,
        { headers: commonHeaders }
      );
      didDoc = typeof data === 'string' ? JSON.parse(data) : data;
    } catch (e: any) {
      const status = e?.response?.status || 500;
      if (status === 404) {
        return res.status(404).json({ error: 'issuer_not_on_chain', message: 'Issuer cannot be verified on-chain.' });
      }
      return res.status(status).json({
        error: 'issuer_lookup_failed',
        message: e?.response?.data?.error || e?.message || 'Failed to retrieve issuer DID from chain'
      });
    }

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

    // 3) Check consent on-chain via /verifyAndLogAccess (must forward selected peer!)
    try {
      const { data: ver } = await axios.post(
        `${selfBase}/verifyAndLogAccess`,
        {
          assetId: String(consentId),
          accessRequest: JSON.stringify({ purpose, operation })
        },
        { headers: commonHeaders }
      );

      if (ver?.result === true) {
        return res.json({
          active: true,
          consentId,
          issuerDid,
          vp_verified: true,
          chain: { issuer_revoked: false },
          consent_check: {
            result: true,
            reason: ver?.reason ?? 'ok',
            validUntil: ver?.validUntil ?? null
          }
        });
      }

      const reason = String(ver?.reason || ver?.status || 'unknown');
      if (/revoked/i.test(reason)) return res.status(409).json({ error: 'consent_revoked', message: 'Consent is revoked on-chain.', details: ver });
      if (/expired/i.test(reason)) return res.status(409).json({ error: 'expired', message: 'Consent is expired on-chain.', details: ver });
      if (/not[_\s-]?found|unknown/i.test(reason)) return res.status(404).json({ error: 'consent_not_found', message: 'Consent does not exist on-chain.', details: ver });

      return res.status(403).json({ error: 'consent_not_allowed', message: 'Consent policy denied access.', details: ver });
    } catch (e: any) {
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



// // Holder revoke
// // POST /agent/proofs/revoke  (holder black box)
// router.post('/proofs/revoke', async (req: any, res, next) => {
//   try {
//     const { peer,selfBase, authHdr } = ctx(req);
//     requireRole(peer, 'holder');

//     const { consentId, seed, privateKeyPem: bodyPrivPem } = req.body || {};
//     if (!consentId) return res.status(400).json({ error: 'consentId is required' });
//     if (!seed && !bodyPrivPem) {
//       return res.status(400).json({ error: 'Provide either seed (base64/utf8) or privateKeyPem' });
//     }

//     // 1) Fetch anchor to get createdTimestamp (the exact timestamp used in signatures)
//     let anchor: any;
//     try {
//       const { data } = await axios.get(
//         `${selfBase}/readVcAnchor/${encodeURIComponent(consentId)}`,
//         { headers: authHdr }
//       );
//       anchor = data;
//     } catch (e: any) {
//       const st = e?.response?.status || 500;
//       const msg = String(e?.response?.data?.error || e?.message || '').toLowerCase();

//       // map "not found" situations to a clean 404
//       if (st === 404 || msg.includes('not found') || msg.includes('does not exist')) {
//         return res.status(404).json({
//           error: 'consent_not_found_on_chain',
//           message: `Consent "${consentId}" does not exist on the blockchain`
//         });
//       }
//       // otherwise propagate the real error
//       throw e;
//     }


//     const timestamp: string | undefined = anchor?.createdTimestamp;
//     const status: string | undefined    = anchor?.status;

//     if (!timestamp) {
//       return res.status(422).json({ error: 'created_timestamp_missing', message: 'Anchor has no createdTimestamp' });
//     }
//     if (status && String(status).toLowerCase() !== 'active') {
//       return res.status(409).json({ error: 'already_not_active', message: `Anchor status is ${status}` });
//     }

//     // 2) Derive or accept keypair
//     let privateKeyPem = bodyPrivPem;
//     let publicKeyPem: string | undefined;

//     if (!privateKeyPem) {
//       // derive from seed
//       try {
//         const { data: kp } = await axios.post(
//           `${selfBase}/deriveKeypair`,
//           { seed, assetId: String(consentId) },
//           { headers: authHdr }
//         );
//         privateKeyPem = kp?.privateKeyPem;
//         publicKeyPem  = kp?.publicKeyPem;
//         if (!privateKeyPem || !publicKeyPem) {
//           return res.status(500).json({ error: 'keypair_derivation_failed' });
//         }
//       } catch (e) {
//         return res.status(500).json({ error: 'keypair_derivation_failed' });
//       }
//     }

//     // If caller supplied a privateKeyPem but not publicKeyPem, we can lazily compute it via /deriveKeypair
//     if (!publicKeyPem && seed) {
//       try {
//         const { data: kp2 } = await axios.post(
//           `${selfBase}/deriveKeypair`,
//           { seed, assetId: String(consentId) },
//           { headers: authHdr }
//         );
//         publicKeyPem = kp2?.publicKeyPem;
//       } catch {/* non-fatal; some ledgers may not validate pub on submit */}
//     }

//     // 3) Sign the action "assetId|timestamp"
//     let signature: string;
//     try {
//       const { data: sig } = await axios.post(
//         `${selfBase}/signVcAnchorAction`,
//         { assetId: String(consentId), timestamp: String(timestamp), privateKeyPem },
//         { headers: authHdr }
//       );
//       signature = sig?.signature;
//       if (!signature) return res.status(500).json({ error: 'sign_failed' });
//     } catch (e) {
//       return res.status(500).json({ error: 'sign_failed' });
//     }

//     // 4) Revoke on-chain
//     try {
//       const payload: any = { assetId: String(consentId), signature };
//       if (publicKeyPem) payload.publicKeyPem = publicKeyPem;

//       const { data } = await axios.post(`${selfBase}/revokeVcAnchor`, payload, { headers: authHdr });
//       // expected: { message: "VC anchor <id> revoked at <iso>" }
//       return res.json({ revoked: true, consentId, message: data?.message || 'revoked' });
//     } catch (e: any) {
//       // surface ledger reasons
//       const st = e?.response?.status || 500;
//       const details = e?.response?.data || e?.message;
//       return res.status(st).json({ revoked: false, error: 'revoke_failed', details });
//     }
//   } catch (e) {
//     next(e);
//   }
// });


// POST /agent/proofs/revoke  (holder black box)
// router.post('/proofs/revoke', async (req: any, res, next) => {
//   try {
//     const { peer, selfBase, authHdr } = ctx(req);
//     requireRole(peer, 'holder');

//     const { consentId, seed, privateKeyPem: bodyPrivPem } = req.body || {};
//     if (!consentId) return res.status(400).json({ error: 'consentId is required' });
//     if (!seed && !bodyPrivPem) {
//       return res.status(400).json({ error: 'Provide either seed (base64/utf8) or privateKeyPem' });
//     }

//     // Always forward selected peer + auth to our own endpoints
//     const headers = { ...authHdr, 'x-selected-peer': String(peer) };

//     // 1) Fetch anchor to get createdTimestamp (the exact timestamp used in signatures)
//     let anchor: any;
//     try {
//       const { data } = await axios.get(
//         `${selfBase}/readVcAnchor/${encodeURIComponent(consentId)}`,
//         { headers }
//       );
//       anchor = data;
//     } catch (e: any) {
//       const st = e?.response?.status || 500;
//       const msg = String(e?.response?.data?.error || e?.message || '').toLowerCase();
//       if (st === 404 || msg.includes('not found') || msg.includes('does not exist')) {
//         return res.status(404).json({
//           error: 'consent_not_found_on_chain',
//           message: `Consent "${consentId}" does not exist on the blockchain`
//         });
//       }
//       throw e;
//     }

//     const timestamp: string | undefined = anchor?.createdTimestamp;
//     const status: string | undefined    = anchor?.status;

//     if (!timestamp) {
//       return res.status(422).json({ error: 'created_timestamp_missing', message: 'Anchor has no createdTimestamp' });
//     }
//     if (status && String(status).toLowerCase() !== 'active') {
//       return res.status(409).json({ error: 'already_not_active', message: `Anchor status is ${status}` });
//     }

//     // 2) Derive or accept keypair
//     let privateKeyPem = bodyPrivPem;
//     let publicKeyPem: string | undefined;

//     if (!privateKeyPem) {
//       try {
//         const { data: kp } = await axios.post(
//           `${selfBase}/deriveKeypair`,
//           { seed, assetId: String(consentId) },
//           { headers }
//         );
//         privateKeyPem = kp?.privateKeyPem;
//         publicKeyPem  = kp?.publicKeyPem;
//         if (!privateKeyPem || !publicKeyPem) {
//           return res.status(500).json({ error: 'keypair_derivation_failed' });
//         }
//       } catch {
//         return res.status(500).json({ error: 'keypair_derivation_failed' });
//       }
//     }

//     // If caller supplied a privateKeyPem but not publicKeyPem, compute via /deriveKeypair (non-fatal if fails)
//     if (!publicKeyPem && seed) {
//       try {
//         const { data: kp2 } = await axios.post(
//           `${selfBase}/deriveKeypair`,
//           { seed, assetId: String(consentId) },
//           { headers }
//         );
//         publicKeyPem = kp2?.publicKeyPem;
//       } catch {/* ignore */}
//     }

//     // 3) Sign the action "assetId|timestamp"
//     let signature: string;
//     try {
//       const { data: sig } = await axios.post(
//         `${selfBase}/signVcAnchorAction`,
//         { assetId: String(consentId), timestamp: String(timestamp), privateKeyPem },
//         { headers }
//       );
//       signature = sig?.signature;
//       if (!signature) return res.status(500).json({ error: 'sign_failed' });
//     } catch {
//       return res.status(500).json({ error: 'sign_failed' });
//     }

//     // 4) Revoke on-chain
//     try {
//       const payload: any = { assetId: String(consentId), signature };
//       if (publicKeyPem) payload.publicKeyPem = publicKeyPem;

//       const { data } = await axios.post(`${selfBase}/revokeVcAnchor`, payload, { headers });
//       return res.json({ revoked: true, consentId, message: data?.message || 'revoked' });
//     } catch (e: any) {
//       const st = e?.response?.status || 500;
//       const details = e?.response?.data || e?.message;
//       return res.status(st).json({ revoked: false, error: 'revoke_failed', details });
//     }
//   } catch (e) {
//     next(e);
//   }
// });


router.post('/proofs/revoke', async (req: any, res, next) => {
  try {
    const { peer } = ctx(req);
    requireRole(peer, 'holder');

    // NEW: accept optional externally-signed payload
    const {
      consentId,
      seed,
      privateKeyPem: bodyPrivPem,
      publicKeyPem: bodyPubPem,   // NEW
      signature: bodySignature    // NEW (base64)
    } = req.body || {};

    if (!consentId) return res.status(400).json({ error: 'consentId is required' });
    if (!bodySignature && !seed && !bodyPrivPem) {
      return res.status(400).json({ error: 'Provide signature, or seed (base64/utf8), or privateKeyPem' });
    }

    const payload: any = req.userPayload;

    // 1) Read anchor directly from Fabric
    let anchor: any;
    try {
      const text = await withContract(payload, async (c: any) =>
        (await c.evaluateTransaction('ReadVcAnchor', String(consentId))).toString()
      );
      anchor = JSON.parse(text);
    } catch (e: any) {
      const msg = String(e?.message || '').toLowerCase();
      if (msg.includes('not found') || msg.includes('does not exist')) {
        return res.status(404).json({
          error: 'consent_not_found_on_chain',
          message: `Consent "${consentId}" does not exist on the blockchain`
        });
      }
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

    // 2) Keys & signature
    let publicKeyPem = bodyPubPem as string | undefined;
    let signature    = bodySignature as string | undefined;

    if (signature) {
      // Externally signed: require publicKeyPem (chaincode verifies against stored hash)
      if (!publicKeyPem) {
        return res.status(400).json({ error: 'publicKeyPem_required_with_signature' });
      }
    } else {
      // Local signing path
      let privateKeyPem = bodyPrivPem as string | undefined;

      if (!privateKeyPem) {
        // derive from seed deterministically
        const { privateKeyPem: priv, publicKeyPem: pub } = deriveEd25519FromSeed(seed, String(consentId));
        privateKeyPem = priv;
        publicKeyPem  = publicKeyPem || pub;
      }

      // If caller supplied privateKeyPem but not publicKeyPem, compute it
      if (!publicKeyPem && privateKeyPem) {
        try {
          const pubKey = crypto.createPublicKey(privateKeyPem);
          publicKeyPem = pubKey.export({ format: 'pem', type: 'spki' }).toString();
        } catch {
          return res.status(400).json({ error: 'invalid_privateKeyPem' });
        }
      }

      // Sign "assetId|timestamp"
      try {
        const msg = Buffer.from(String(consentId) + '|' + String(timestamp), 'utf8');
        const sig = crypto.sign(null, msg, privateKeyPem as string);
        signature = sig.toString('base64');
      } catch {
        return res.status(500).json({ error: 'sign_failed' });
      }
    }

    // 3) Revoke on-chain
    try {
      const out = await withContract(payload, async (c: any) =>
        (await c.submitTransaction('RevokeVc', String(consentId), String(publicKeyPem), String(signature))).toString()
      );
      return res.json({ revoked: true, consentId, message: out || 'revoked' });
    } catch (e: any) {
      return res.status(e?.response?.status || 500).json({
        revoked: false,
        error: 'revoke_failed',
        details: e?.response?.data || e?.message || 'unknown'
      });
    }
  } catch (e) {
    next(e);
  }
});



export default router;
