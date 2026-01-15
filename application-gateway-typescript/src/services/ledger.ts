// src/services/ledger.ts

import { Gateway, GatewayOptions } from 'fabric-network';
import { buildCCP } from '../AppUtil';
import { setupWallet } from '../fabricWallet';
import { getPolicyByHash } from "../retention";

export type UserPayload = { selected_peer: string; username?: string };

const channelName  = process.env.CHANNEL_NAME  || 'mychannel';
const chaincode    = process.env.CHAINCODE_NAME || 'basic';
const contractName = 'VcAnchorContract';

export async function connectFor(payload: UserPayload) {
  const ccp = buildCCP(Number(payload.selected_peer));

  // normalize username exactly like your current setupConnection
  let username = payload.username?.trim() || 'User1';
  username = username.replace(/@org\d+$/, '');
  username = username.toLowerCase() !== 'user1' ? username.toLowerCase() : 'User1';

  const wallet = await setupWallet(payload.selected_peer, username);
  const userId = username === 'admin' ? 'admin' : `${username}@org${payload.selected_peer}`;
  const id = await wallet.get(userId);
  if (!id) throw new Error(`Identity for user ${userId} not in wallet`);

  const gw = new Gateway();
  const opts: GatewayOptions = { wallet, identity: userId, discovery: { enabled: true, asLocalhost: true } };
  await gw.connect(ccp, opts);
  return gw;
}

export async function withContract<T>(payload: UserPayload, fn: (c: any)=>Promise<T>): Promise<T> {
  const gw = await connectFor(payload);
  try {
    const net = await gw.getNetwork(channelName);
    const c   = net.getContract(chaincode, contractName);
    return await fn(c);
  } finally {
    gw.disconnect();
  }
}

// ---- DID registry ----
export async function storeDIDkeyOnFabric(
  payload: UserPayload,
  did: string,
  publicKeyBase58: string,
  bbsPublicKeyBase58: string | null | undefined,
  serviceEndpoint: string,
) {
  return withContract(payload, async c =>
    (await c.submitTransaction('storeDIDkey', did, publicKeyBase58, bbsPublicKeyBase58, serviceEndpoint)).toString()
  );
}

export async function readDIDkeyFromFabric(payload: UserPayload, did: string) {
  const text = await withContract(payload, async c => (await c.evaluateTransaction('readDIDkey', did)).toString());
  return JSON.parse(text);
}

export async function readLatestActiveDidFromFabric(payload: UserPayload, creator: string) {
  const text = await withContract(payload, async c => (await c.evaluateTransaction('latestActiveDid', creator)).toString());
  return JSON.parse(text);
}

export async function revokeDIDkeyOnFabric(payload: UserPayload, did: string) {
  return withContract(payload, async c => (await c.submitTransaction('revokeDIDkey', did)).toString());
}

// ---- VC anchor ----


export async function createVcAnchorOnFabric(
  payload: any,
  input: { consentId: string; publicKeyPem: string; policyHash: string }
) {
  const gateway = await connectFor(payload);
  try {
    const { consentId, publicKeyPem, policyHash } = input;

    const doc: any = await getPolicyByHash(policyHash);
    if (!doc) throw new Error("Unknown policyHash");
    const policy = typeof doc.policyJson === "string" ? JSON.parse(doc.policyJson) : doc.policyJson;

    const allowedPurposes   = (policy.purposes   ?? []).map((s: string) => s.trim().toLowerCase());
    const allowedOperations = (policy.operations ?? []).map((s: string) => s.trim().toLowerCase());
    const { durationSecs, assuranceLevel, templateHash } = policy || {};

    if (!Number.isFinite(durationSecs) || durationSecs <= 0) {
      throw new Error("Policy missing/invalid durationSecs");
    }

    const network  = await gateway.getNetwork(process.env.CHANNEL_NAME || "mychannel");
    const contract = network.getContract(process.env.CHAINCODE_NAME || "basic", "VcAnchorContract");
    const buf = await contract.submitTransaction(
      "CreateVcAnchor",
      consentId,
      publicKeyPem,
      policyHash,
      templateHash,
      String(durationSecs),
      assuranceLevel || "",
      JSON.stringify(allowedPurposes),
      JSON.stringify(allowedOperations)
    );
    return buf.toString();
  } finally {
    gateway.disconnect();
  }
}

// export async function createVcAnchorOnFabric(payload: UserPayload, consentId: string, publicKeyPem: string, policyHash: string) {
//   return withContract(payload, async c => (await c.submitTransaction('CreateVcAnchor', consentId, publicKeyPem, policyHash)).toString());
// }

export async function revokeVcOnFabric(payload: UserPayload, assetId: string, publicKeyPem: string, signature: string) {
  return withContract(payload, async c => (await c.submitTransaction('RevokeVc', assetId, publicKeyPem, signature)).toString());
}

export async function readVcAnchorFromFabric(payload: UserPayload, assetId: string) {
  const text = await withContract(payload, async c => (await c.evaluateTransaction('ReadVcAnchor', assetId)).toString());
  return JSON.parse(text);
}

export async function listAllVcAnchorsFromFabric(payload: UserPayload) {
  const text = await withContract(payload, async c => (await c.evaluateTransaction('GetAllVcAnchors')).toString());
  return JSON.parse(text);
}

export async function verifyAndLogAccessOnFabric(payload: UserPayload, assetId: string, accessRequestJson: string) {
  const text = await withContract(payload, async c => (await c.submitTransaction('VerifyAndLogAccess', assetId, accessRequestJson)).toString());
  try { return JSON.parse(text); } catch { return { result: text === 'true' }; }
}
