// src/app.ts

//  * Copyright IBM Corp.
//  * SPDX-License-Identifier: Apache-2.0

import express, { Request, Response, NextFunction } from "express";
import http from "http";
import https from "https";
import fs from "fs";
import cors from "cors";
import bodyParser from "body-parser";
import axios from "axios";
import FabricCAServices from "fabric-ca-client";
import helmet from "helmet";

// Local modules (thin controllers call into these)
import agentRouter from "./routes/agents";
import fabricDidRouter from "./routes/fabric-did";
import issuerWebhooks from './routes/issuer-webhooks';
//import holderWebhooks from "./routes/holder-webhooks";

// Services
import {
  storeDIDkeyOnFabric,
  readDIDkeyFromFabric,
  revokeVcOnFabric,
  createVcAnchorOnFabric,
  readVcAnchorFromFabric,
  listAllVcAnchorsFromFabric,
  verifyAndLogAccessOnFabric,
  connectFor,// used by identity mgr
  revokeDIDkeyOnFabric,
  readLatestActiveDidFromFabric
} from "./services/ledger";



import {
  savePolicy,
  getPolicyByHash,
  deletePolicyByHash,
  saveContractDescriptor,
  getContractDescriptorByHash,
  findContractDescriptors,
  saveAuditEvent,
  listAuditEvents
} from './retention';

import {
  deriveEd25519FromSeed,
  signVcAnchorAction,
} from "./services/cryptography";

import {
  buildCCP,
  prettyJSONString,
} from "./AppUtil";

import { generateConsentPolicy, generateContractDescriptor, validatePolicyForDeployment } from "./generator";

import {
  setupWallet,
  addIdentity,
  removeIdentity,
  listIdentities,
  buildCAClient,
} from "./fabricWallet";
// --- Auth middleware (inline for now) ---
import jwt from "jsonwebtoken";
import { resolvePeer } from "./helper/peers";
import { validateDatasetIds } from "./helper/datasetIds";

const KEYCLOAK_URL = process.env.KEYCLOAK_URL || "";

async function getKeycloakPublicKey() {
  if (!KEYCLOAK_URL) return null;
  const { data } = await axios.get(KEYCLOAK_URL);
  return `-----BEGIN CERTIFICATE-----\n${data.keys[0].x5c[0]}\n-----END CERTIFICATE-----`;
}

async function verifyToken(req: express.Request): Promise<any | null> {
  const auth = req.headers.authorization || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;
  //if (!token) return null;
  if (!token) return {};

  try {
    if (!KEYCLOAK_URL) {
      const decoded: any = jwt.decode(token) || {};
      // In dev mode (no KEYCLOAK_URL), at least reject clearly expired tokens if exp is present
      if (decoded?.exp && Date.now() / 1000 > Number(decoded.exp)) {
        throw new Error("JWT expired");
      }
      return decoded;
    }
    const pub = await getKeycloakPublicKey();
    return jwt.verify(token, pub as string, { algorithms: ["RS256"] });
  } catch {
    //return null;
    // allow ACA-Py tenant JWTs (opaque to Keycloak) to pass through
   return jwt.decode(token) || {};
  }
}

// export async function attachUserPayload(req: any, res: any, next: any) {
//   if (req.method === "OPTIONS" || req.path === "/health") return next();

//   const payload = (await verifyToken(req)) || {};
//   // fallbacks for selected_peer if it isn't in the JWT
//   const sp =
//     payload.selected_peer ||
//     req.get?.("x-selected-peer") ||
//     (req.headers && (req.headers["x-selected-peer"] as any)) ||
//     req.query?.selected_peer ||
//     req.body?.selected_peer;

//   // normalize selected_peer and validate membership
//   const normalized = sp != null ? String(sp).trim() : undefined;
//   const allowedPeers = new Set(["1", "2", "3"]);
//   if (normalized && !allowedPeers.has(normalized)) {
//     return res.status(400).json({ error: "Invalid x-selected-peer (allowed: 1,2,3)" });
//   }

//   payload.selected_peer = normalized ?? payload.selected_peer;
//   req.userPayload = payload || {};

//   next();
// }


export async function attachUserPayload(req: any, res: any, next: any) {
  if (req.method === "OPTIONS" || req.path === "/health") return next();

  const payload = (await verifyToken(req)) || {};
  const sp =
    payload.selected_peer ??
    req.get?.("x-selected-peer") ??
    (req.headers && (req.headers["x-selected-peer"] as any)) ??
    req.query?.selected_peer ??
    req.body?.selected_peer;

  const normalized = resolvePeer(sp);
  // Don’t hard-reject here; let ctx() enforce. But if we can normalize, persist it:
  if (normalized) payload.selected_peer = normalized;
  req.userPayload = payload || {};
  next();
}


// --- end auth middleware ---



//mport { attachUserPayload, verifyToken } from "./middleware/auth";

// ----------------------------------------------------------------------------
// App bootstrap
// ----------------------------------------------------------------------------

const app = express();
const server_port = Number(process.env.SERVER_PORT || 8000);
const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(",")
  : [];

// Security headers
app.use(helmet());

// CORS + JSON
app.use(
  cors({
    origin: ALLOWED_ORIGINS,
    credentials: true,
    methods: ["GET", "POST", "PATCH", "DELETE", "PUT"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Selected-Peer", "x-selected-peer"],
  })
);
app.use(bodyParser.json({ limit: "5mb" }));
app.use(issuerWebhooks); // mount issuer webhooks
//app.use(holderWebhooks); // mount holder webhooks


// Health
app.get("/health", (_req, res) => res.json({ ok: true }));

// Attach req.userPayload for all protected routes (skips /health and preflights)
app.use(attachUserPayload);

app.use("/fabric-did", fabricDidRouter);
// ----------------------------------------------------------------------------
// Identity management (kept as-is, but slimmer)
// ----------------------------------------------------------------------------

app.post("/manageIdentities", async (req: Request, res: Response) => {
  let gateway: any;
  try {
    const payload: any = req.userPayload;
    const selectedPeer = payload.selected_peer;
    const username = payload.username;

    const { action, identityName } = req.body;
    const identityNameOrg = `${identityName}@org${selectedPeer}`;

    // Connect so fabric CA client has proper context
    gateway = await connectFor(payload);

    const ccp = buildCCP(Number(selectedPeer));
    const caClient = buildCAClient(FabricCAServices, ccp, `ca.org${selectedPeer}.example.com`);
    await setupWallet(selectedPeer, username);

    if (action === "add") {
      await addIdentity(caClient, selectedPeer, identityNameOrg);
      return res.json({ message: `Identity ${identityNameOrg} added` });
    }
    if (action === "list") {
      const identities = await listIdentities(selectedPeer);
      return res.json({ identities });
    }
    if (action === "remove") {
      await removeIdentity(caClient, identityNameOrg, selectedPeer);
      return res.json({ message: `Identity ${identityNameOrg} removed` });
    }
    return res.status(400).json({ error: "Invalid action" });
  } catch (err: any) {
    console.error("manageIdentities error:", err);
    res.status(500).json({ error: err?.message || "Failed to manage identities" });
  } finally {
    try { gateway?.disconnect(); } catch {}
  }
});

// ----------------------------------------------------------------------------
// DID key management
// ----------------------------------------------------------------------------

app.post("/storeDIDkey/:didID", async (req, res) => {
  try {
    const did = req.params.didID;
    if (!did) return res.status(400).json({ error: "didID is required" });

    const { 
      publicKeyBase58,
      bbsPublicKeyBase58 = "", 
      serviceEndpoint="http://issuer:8050" } = req.body || {};
    if (!publicKeyBase58 || !serviceEndpoint) {
      return res.status(400).json({ error: "publicKeyBase58 and serviceEndpoint are required" });
    }

    const payload: any = req.userPayload;

    const result = await storeDIDkeyOnFabric(payload, did, publicKeyBase58,bbsPublicKeyBase58, serviceEndpoint);
    try { return res.status(200).json(JSON.parse(result)); }
    catch { return res.status(200).json({ result }); }
  } catch (err: any) {
    console.error("storeDIDkey error:", err);
    res.status(500).json({ error: err?.message || "Internal error" });
  }
});


app.get("/readDIDkey/:didID", async (req, res) => {
  try {
    const did = req.params.didID;
    const payload: any = req.userPayload;
    const out = await readDIDkeyFromFabric(payload, did);
    return res.json(out);
  } catch (err: any) {
    console.error("readDIDkey error:", err);
    res.status(500).json({ error: err?.message || "Failed to read DID key" });
  }
});

app.get("/latestActiveDid/:creator", async (req, res) => {
  try {
    const creator = req.params.creator; // e.g., "Org1"
    if (!creator) return res.status(400).json({ error: "creator is required" });

    const payload: any = req.userPayload;
    const out = await readLatestActiveDidFromFabric(payload, creator);
    return res.json(out);
  } catch (err: any) {
    const msg = String(err?.message || "");
    if (msg.includes("No active DID for creator")) {
      return res.status(404).json({ error: msg });
    }
    console.error("latestActiveDid error:", err);
    res.status(500).json({ error: msg || "Failed to read latest active DID" });
  }
});


app.post("/revokeDIDkey/:didID", async (req, res) => {
  try {
    const did = req.params.didID;
    const payload: any = req.userPayload;
    const out = await revokeDIDkeyOnFabric(payload, did);
    return res.json({ message: out });
  } catch (err: any) {
    console.error("revokeDIDkey error:", err);
    res.status(500).json({ error: err?.message || "Failed to revoke DID key" });
  }
});

// ----------------------------------------------------------------------------
// VC Anchor lifecycle
// ----------------------------------------------------------------------------

app.post("/createVcAnchor", async (req, res) => {
  try {
    const { consentId, publicKeyPem, policyHash } = req.body || {};
    if (!consentId || !publicKeyPem || !policyHash) {
      return res.status(400).json({ error: "consentId, publicKeyPem, policyHash are required" });
    }

    // Validate policy exists off-chain (and let the service handle the rest)
    const payload: any = req.userPayload;
    const result = await createVcAnchorOnFabric(payload,  {consentId, publicKeyPem, policyHash });
    return res.json({ message: result });
  } catch (err: any) {
    console.error("createVcAnchor error:", err);
    res.status(500).json({ error: err?.message || "Failed to create anchor" });
  }
});

app.get("/readVcAnchor/:assetId", async (req, res) => {
  try {
    const payload: any = req.userPayload;
    const out = await readVcAnchorFromFabric(payload, req.params.assetId);
    return res.json(out);
  } catch (err: any) {
    console.error("readVcAnchor error:", err);
    res.status(500).json({ error: err?.message || "Failed to read anchor" });
  }
});

app.get("/getAllVcAnchors", async (req, res) => {
  try {
    const payload: any = req.userPayload;
    const out = await listAllVcAnchorsFromFabric(payload);
    return res.json(out);
  } catch (err: any) {
    console.error("getAllVcAnchors error:", err);
    res.status(500).json({ error: err?.message || "Failed to list anchors" });
  }
});

app.post("/revokeVcAnchor", async (req, res) => {
  try {
    const { assetId, publicKeyPem, signature } = req.body || {};
    if (!assetId || !publicKeyPem || !signature) {
      return res.status(400).json({ error: "assetId, publicKeyPem, signature are required" });
    }
    const payload: any = req.userPayload;

    const ret = await revokeVcOnFabric(payload, assetId, publicKeyPem, signature);
    return res.json({ message: ret });
  } catch (err: any) {
    console.error("revokeVcAnchor error:", err);
    res.status(500).json({ error: err?.message || "Failed to revoke anchor" });
  }
});

// Verify & log access
app.post("/verifyAndLogAccess", async (req, res) => {
  try {
    const { assetId, accessRequest } = req.body || {};
    if (!assetId || !accessRequest) {
      return res.status(400).json({ error: "assetId and accessRequest are required" });
    }
    const payload: any = req.userPayload;
    const out = await verifyAndLogAccessOnFabric(payload, assetId, accessRequest);
    try {
      let reqObj: any = {};
      try {
        reqObj = typeof accessRequest === 'string' ? JSON.parse(accessRequest) : accessRequest;
      } catch {
        reqObj = {};
      }
      const toArr = (x: any) => Array.isArray(x) ? x : (x == null ? [] : [x]);
      const norm = (s: string) => String(s).trim().toLowerCase();
      const purposes = toArr(reqObj?.purpose).map(norm).filter(Boolean);
      const operations = toArr(reqObj?.operation).map(norm).filter(Boolean);
      const requesterOrg = payload?.selected_peer ? `Org${payload.selected_peer}` : null;
      await saveAuditEvent({
        consentId: String(assetId),
        requesterOrg,
        purposes,
        operations,
        result: out?.result === true,
        reason: out?.reason ?? null,
        txId: out?.txId ?? null
      });
    } catch (e) {
      console.warn('audit logging failed:', e);
    }
    return res.json(out);
  } catch (err: any) {
    console.error("verifyAndLogAccess error:", err);
    res.status(500).json({ error: err?.message || "verifyAndLogAccess failed" });
  }
});

// ----------------------------------------------------------------------------
// Consent policy generator + retention
// ----------------------------------------------------------------------------

app.post("/upsertConsentPolicy", async (req, res) => {
  try {
    const {
      policyJson,
      policyHash,
      templateHash,
      templateVersion,
      durationSecs,
      assuranceLevel,
      constraintsSet,
    } = generateConsentPolicy(req.body);

    const existing: any = await getPolicyByHash(policyHash);
    if (existing) {
      const stored = typeof existing.policyJson === "string"
        ? JSON.parse(existing.policyJson)
        : existing.policyJson;
      return res.json({
        policyJson: stored,
        policyHash,
        templateHash: existing.templateHash || templateHash,
        templateVersion,
        durationSecs: stored.durationSecs ?? durationSecs,
        assuranceLevel: stored.assuranceLevel ?? assuranceLevel,
        constraintsSet,
        existed: true,
      });
    }

    await savePolicy(policyHash, JSON.stringify(policyJson), templateHash, templateVersion);
    return res.json({
      policyJson,
      policyHash,
      templateHash,
      templateVersion,
      durationSecs,
      assuranceLevel,
      constraintsSet,
      existed: false,
    });
  } catch (err: any) {
    console.error("upsertConsentPolicy error:", err);
    res.status(500).json({ error: err?.message || "Failed to generate policy" });
  }
});

app.get("/getPolicyByHash/:hash", async (req, res) => {
  try {
    const doc = await getPolicyByHash(req.params.hash);
    if (!doc) return res.status(404).json({ error: "Not found" });
    return res.json(doc);
  } catch (err: any) {
    console.error("getPolicyByHash error:", err);
    res.status(500).json({ error: err?.message || "Failed to fetch policy" });
  }
});

app.post("/deletePolicyByHash/:hash", async (req, res) => {
  try {
    const doc = await getPolicyByHash(req.params.hash);
    if (!doc) return res.status(404).json({ error: "Not found" });
    await deletePolicyByHash(req.params.hash);
    return res.json({ success: true });
  } catch (err: any) {
    console.error("deletePolicyByHash error:", err);
    res.status(500).json({ error: err?.message || "Failed to delete policy" });
  }
});

// ----------------------------------------------------------------------------
// Contract descriptors (Generator + Finder)
// ----------------------------------------------------------------------------

app.post("/upsertContractDescriptor", async (req, res) => {
  try {
    const {
      policyHash,
      datasetIds,
      datasetId,
      issuerOrgId,
      context,
      descriptorVersion,
      templateVersion
    } = req.body || {};

    if (!policyHash) return res.status(400).json({ error: "policyHash is required" });
    const ds = Array.isArray(datasetIds) ? datasetIds : (datasetId ? [datasetId] : []);
    if (!ds || ds.length === 0) return res.status(400).json({ error: "datasetIds (array) or datasetId is required" });
    const vds = validateDatasetIds(ds);
    if (!vds.ok) return res.status(400).json(vds);

    const policyDoc: any = await getPolicyByHash(policyHash);
    if (!policyDoc) return res.status(404).json({ error: "Policy not found" });

    const policyJson = typeof policyDoc.policyJson === "string"
      ? JSON.parse(policyDoc.policyJson)
      : policyDoc.policyJson;

    validatePolicyForDeployment(policyJson);

    const payload: any = req.userPayload;
    const issuer = issuerOrgId || (payload?.selected_peer ? `Org${payload.selected_peer}` : null);
    const tplHash = policyDoc.templateHash || policyJson.templateHash;
    const tplVersion = policyDoc.templateVersion || templateVersion || undefined;

    const { descriptorJson, descriptorHash } = generateContractDescriptor({
      policyJson,
      policyHash,
      templateHash: tplHash,
      templateVersion: tplVersion,
      datasetIds: vds.datasetIds || ds,
      issuerOrgId: issuer,
      context,
      descriptorVersion
    });

    const existing = await getContractDescriptorByHash(descriptorHash);
    if (existing) {
      return res.json({ descriptorHash, descriptorJson: existing.descriptorJson || descriptorJson, existed: true });
    }

    await saveContractDescriptor({
      descriptorHash,
      descriptorJson,
      policyHash,
      templateHash: tplHash,
      templateVersion: tplVersion,
      datasetIds: descriptorJson.datasetIds || (vds.datasetIds || ds),
      purposes: descriptorJson.purposes || policyJson.purposes || [],
      operations: descriptorJson.operations || policyJson.operations || [],
      durationSecs: policyJson.durationSecs,
      assuranceLevel: policyJson.assuranceLevel ?? null,
      issuerOrgId: issuer
    });

    return res.json({ descriptorHash, descriptorJson, existed: false });
  } catch (err: any) {
    console.error("upsertContractDescriptor error:", err);
    res.status(500).json({ error: err?.message || "Failed to upsert contract descriptor" });
  }
});

app.get("/getContractDescriptor/:hash", async (req, res) => {
  try {
    const doc = await getContractDescriptorByHash(req.params.hash);
    if (!doc) return res.status(404).json({ error: "Not found" });
    return res.json(doc);
  } catch (err: any) {
    console.error("getContractDescriptor error:", err);
    res.status(500).json({ error: err?.message || "Failed to fetch contract descriptor" });
  }
});

app.post("/findContracts", async (req, res) => {
  try {
    const { datasetId, purpose, operation, issuerOrgId, templateVersion, limit } = req.body || {};
    if (!datasetId && !purpose && !operation) {
      return res.status(400).json({ error: "At least one of datasetId, purpose, operation is required" });
    }
    const docs = await findContractDescriptors({
      datasetId,
      purpose,
      operation,
      issuerOrgId,
      templateVersion,
      limit
    });
    return res.json({ count: docs.length, results: docs });
  } catch (err: any) {
    console.error("findContracts error:", err);
    res.status(500).json({ error: err?.message || "Failed to find contracts" });
  }
});

// ----------------------------------------------------------------------------
// Off-chain audit
// ----------------------------------------------------------------------------

app.get("/audit/access/:consentId", async (req, res) => {
  try {
    const consentId = req.params.consentId;
    const docs = await listAuditEvents(consentId);
    return res.json({ count: docs.length, results: docs });
  } catch (err: any) {
    console.error("listAuditEvents error:", err);
    res.status(500).json({ error: err?.message || "Failed to list audit events" });
  }
});

// Pre-check (off-chain quick allow/deny)
app.post("/precheckConsent", async (req, res) => {
  try {
    const { assetId, purpose, operation, minAssuranceLevel } = req.body || {};
    if (!assetId || !purpose || !operation) {
      return res.status(400).json({ error: "assetId, purpose, operation are required" });
    }

    // Read anchor (evaluate) + resolve policy
    const payload: any = req.userPayload;
    const anchor = await readVcAnchorFromFabric(payload, assetId);
    if (!anchor || !anchor.assetId) {
      return res.json({ allowed: false, reason: "anchor_not_found" });
    }

    const nowIso = new Date().toISOString();
    if (anchor.status !== "active" || nowIso > anchor.validUntil) {
      return res.json({ allowed: false, reason: "revoked_or_expired", anchorSummary: { status: anchor.status, validUntil: anchor.validUntil } });
    }

    const policyDoc = await getPolicyByHash(anchor.policyHash);
    if (!policyDoc) return res.json({ allowed: false, reason: "policy_not_found" });

    const policy = typeof policyDoc.policyJson === "string"
      ? JSON.parse(policyDoc.policyJson)
      : policyDoc.policyJson;

    const norm = (s: string) => String(s).trim().toLowerCase();
    const allowedPurposes = (policy.purposes ?? []).map(norm);
    const allowedOperations = (policy.operations ?? []).map(norm);

    const okPurpose = allowedPurposes.includes(norm(purpose));
    const okOperation = allowedOperations.includes(norm(operation));

    if (!okPurpose || !okOperation) {
      return res.json({
        allowed: false,
        reason: "purpose_or_operation_not_allowed",
        details: { purpose, operation, allowedPurposes, allowedOperations },
      });
    }

    if (minAssuranceLevel) {
      const order = ["AL1", "AL2", "AL3"];
      const have = String(anchor.assuranceLevel || policy.assuranceLevel || "AL1");
      const need = String(minAssuranceLevel);
      if (order.indexOf(have) < order.indexOf(need)) {
        return res.json({ allowed: false, reason: "assurance_too_low", have, need });
      }
    }

    return res.json({
      allowed: true,
      reason: "ok",
      anchorSummary: {
        assetId: anchor.assetId,
        status: anchor.status,
        validUntil: anchor.validUntil,
        assuranceLevel: anchor.assuranceLevel || policy.assuranceLevel || null,
      },
      policySummary: {
        hash: anchor.policyHash,
        templateHash: anchor.templateHash,
      },
    });
  } catch (err: any) {
    console.error("precheckConsent error:", err);
    res.status(500).json({ error: err?.message || "precheck failed" });
  }
});

// ----------------------------------------------------------------------------
// Crypto helpers
// ----------------------------------------------------------------------------

app.post("/deriveKeypair", async (req, res) => {
  try {
    const { seed, assetId } = req.body || {};
    if (!seed || !assetId) return res.status(400).json({ error: "seed and assetId are required" });
    const { privateKeyPem, publicKeyPem } = deriveEd25519FromSeed(seed, assetId);
    return res.json({ privateKeyPem, publicKeyPem, alg: "Ed25519" });
  } catch (err: any) {
    console.error("deriveKeypair error:", err);
    res.status(500).json({ error: err?.message || "Failed to derive keypair" });
  }
});

app.post("/signVcAnchorAction", async (req, res) => {
  try {
    const { assetId, timestamp, privateKeyPem } = req.body || {};
    if (!assetId || !timestamp || !privateKeyPem) {
      return res.status(400).json({ error: "assetId, timestamp, privateKeyPem are required" });
    }
    const out = signVcAnchorAction(assetId, timestamp, privateKeyPem);
    return res.json(out);
  } catch (err: any) {
    console.error("signVcAnchorAction error:", err);
    res.status(500).json({ error: err?.message || "Failed to sign" });
  }
});

// ----------------------------------------------------------------------------
// Mount ACA-Py agent routes (issuer/holder/verifier flows)
// ----------------------------------------------------------------------------

app.use("/agent", agentRouter);

// ----------------------------------------------------------------------------
// Error handler + server
// ----------------------------------------------------------------------------

app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  const status = err?.status || 500;
  res.status(status).json({ error: err?.message || "Server error" });
});

function setupServer() {
  const useHttps = process.env.USE_HTTPS === "true";
  if (!useHttps) {
    http.createServer(app).listen(server_port, () => {
      console.log(`HTTP server listening on :${server_port}`);
    });
    return;
  }

  let keyFile = "../../certs/localhost.key";
  let certFile = "../../certs/localhost.cert";
  let caFile: string | undefined;

  if (process.env.CERTS === "production") {
    keyFile = "../../certs/private.key";
    certFile = "../../certs/certificate.cert";
    caFile = "../../certs/ca_bundle.crt";
  }

  try {
    const key = fs.readFileSync(keyFile);
    const cert = fs.readFileSync(certFile);
    const opts: { key: Buffer; cert: Buffer; ca?: Buffer } = { key, cert };
    if (caFile && fs.existsSync(caFile)) opts.ca = fs.readFileSync(caFile);

    https.createServer(opts, app).listen(server_port, () => {
      console.log(`HTTPS server listening on :${server_port}`);
    });
  } catch (e) {
    console.error("HTTPS setup failed, falling back to HTTP:", e);
    http.createServer(app).listen(server_port, () => {
      console.log(`HTTP server listening on :${server_port}`);
    });
  }
}


app.post("/anchors/create", async (req, res) => {
  try {
    const payload: any = req.userPayload; // added by your attachUserPayload middleware

    const {
      consentId,
      purposes,
      operations,
      datasetIds,
      datasetId,
      durationDays,
      assuranceLevel = "AL1", // fallback "AL1"
      version = "3",          // fallback "3"
      publicKeyPem
    } = req.body || {};

    if (!consentId || !publicKeyPem) {
      return res.status(400).json({ error: "consentId and publicKeyPem are required" });
    }

    // 1) Generate or reuse the policy (same semantics as /upsertConsentPolicy)
    const genIn = {
      purposes,
      operations,
      durationDays,
      assuranceLevel,
      version
    };

    const {
      policyJson,
      policyHash,
      templateHash,
      templateVersion,
      durationSecs,
      assuranceLevel: alOut,
      constraintsSet
    } = generateConsentPolicy(genIn);

    // Optional: create contract descriptor for Finder (off-chain)
    let descriptorHash: string | null = null;
    try {
      const ds = Array.isArray(datasetIds) ? datasetIds : (datasetId ? [datasetId] : []);
      if (ds && ds.length > 0) {
        const vds = validateDatasetIds(ds);
        if (!vds.ok) throw vds;
        validatePolicyForDeployment(policyJson);
        const payload: any = req.userPayload;
        const issuerOrgId = payload?.selected_peer ? `Org${payload.selected_peer}` : null;
        const { descriptorJson, descriptorHash: dHash } = generateContractDescriptor({
          policyJson,
          policyHash,
          templateHash,
          templateVersion,
          datasetIds: vds.datasetIds || ds,
          issuerOrgId
        });
        await saveContractDescriptor({
          descriptorHash: dHash,
          descriptorJson,
          policyHash,
          templateHash,
          templateVersion,
          datasetIds: descriptorJson.datasetIds || (vds.datasetIds || ds),
          purposes: descriptorJson.purposes || policyJson.purposes || [],
          operations: descriptorJson.operations || policyJson.operations || [],
          durationSecs: policyJson.durationSecs,
          assuranceLevel: policyJson.assuranceLevel ?? null,
          issuerOrgId
        });
        descriptorHash = dHash;
      }
    } catch (e) {
      console.warn('contract descriptor creation skipped/failed:', e);
    }

    // Idempotent save: if exists return stored; else save new
    const existing: any = await getPolicyByHash(policyHash);
    let effectivePolicy = policyJson;
    let effectiveTemplateHash = templateHash;

    if (existing) {
      // tolerate stored as string or object
      effectivePolicy = typeof existing.policyJson === "string"
        ? JSON.parse(existing.policyJson)
        : existing.policyJson;
      effectiveTemplateHash = existing.templateHash || templateHash;
    } else {
      await savePolicy(policyHash, JSON.stringify(policyJson), templateHash, templateVersion);
    }

    // 2) Create anchor on Fabric (reuses your services/ledger)
    const anchorResp = await createVcAnchorOnFabric(payload,{ 
      consentId,
      publicKeyPem,
      policyHash}
    );

    return res.json({
      ok: true,
      consentId,
      anchor: anchorResp, // whatever the chaincode returns
      descriptorHash,
      policy: {
        policyHash,
        templateHash: effectiveTemplateHash,
        templateVersion,
        durationSecs: effectivePolicy.durationSecs ?? durationSecs,
        assuranceLevel: effectivePolicy.assuranceLevel ?? alOut,
        constraintsSet
      }
    });
  } catch (err: any) {
    console.error("anchors/create error:", err);
    return res.status(500).json({ error: err?.message || "Failed to create anchor" });
  }
});


setupServer();

export default app;
