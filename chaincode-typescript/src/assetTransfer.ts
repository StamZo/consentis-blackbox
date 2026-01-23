/*
  SPDX-License-Identifier: Apache-2.0
*/
//npm run build FOR ANY CHANGE TO TAKE EFFECT!!
//org1=issuer, org2=holders, org3=verifiers

import { Context, Contract, Info, Transaction, Returns } from 'fabric-contract-api';
import stringify from 'json-stringify-deterministic';
import sortKeysRecursive from 'sort-keys-recursive';
import { ClientIdentity } from 'fabric-shim';
import { VcAnchor } from './asset'; 
import { DID } from './did'; 
import * as crypto from 'crypto';

const IDX_ACTIVE = 'IDX:DID:ACTIVE';
function invTs(createdMs: number): string {
  const MAX = 9999999999999;                 // ~ Sat Nov 20 2286
  return String(MAX - createdMs).padStart(13, '0');
}
function spkiDerSha256(publicKeyPem: string): string {
  const der = crypto.createPublicKey(publicKeyPem)
    .export({ type: 'spki', format: 'der' }) as Buffer;
  return crypto.createHash('sha256').update(der).digest('hex');
}
function assertEdDsaKey(pem: string): 'ed25519' | 'ed448' {
  const k = crypto.createPublicKey(pem);
  const t = (k as any).asymmetricKeyType as string; // 'ed25519' | 'ed448' | 'rsa' | 'ec' | ...
  if (t !== 'ed25519' && t !== 'ed448') {
    throw new Error('Only EdDSA keys are supported (Ed25519 or Ed448)');
  }
  return t as 'ed25519' | 'ed448';
}


@Info({ title: 'VcAnchorContract', description: 'Smart contract for anchoring VCs with revocation by private key' })
export class VcAnchorContract extends Contract {
    Cid: any;

    // Store the didkey of the issuer for verification purposes
    @Transaction()
    public async storeDIDkey(ctx: Context, didID: string, publicKeyBase58: string, bbsPublicKeyBase58: string | null , serviceEndpoint: string): Promise<string> {
        this.Cid = new ClientIdentity(ctx.stub);
        const callerMSPID = this.Cid.getMSPID().slice(0, -3);
        if (callerMSPID !== "Org1") throw new Error('Only an issuer can store a DID key');

        const exists = await this.AssetExists(ctx, didID);
        if (exists) {
            const data = await ctx.stub.getState(didID);
            const anchor: DID = JSON.parse(data.toString());
            if (anchor.revoked) throw new Error('DID key is revoked.');

            const txId = ctx.stub.getTxID();
            const timestamp = ctx.stub.getTxTimestamp();
            const updatedTimestamp = new Date(Number(timestamp.seconds) * 1000 + Math.round(timestamp.nanos / 1000000)).toISOString();
            const bbs = !bbsPublicKeyBase58 || bbsPublicKeyBase58 === "null" ? null : bbsPublicKeyBase58;

            const prevPublicKeyBase58 = anchor.publicKeyBase58;
            const prevBbsPublicKeyBase58 = anchor.bbsPublicKeyBase58 ?? null;
            const prevServiceEndpoint = anchor.serviceEndpoint ?? null;

            anchor.publicKeyBase58 = publicKeyBase58;
            anchor.bbsPublicKeyBase58 = bbs;
            anchor.serviceEndpoint = serviceEndpoint;
            anchor.revoked = false;
            anchor.revokedTimestamp = null;
            anchor.auditTrail = anchor.auditTrail || [];
            anchor.auditTrail.push({
                timestamp: updatedTimestamp,
                txId,
                action: 'rotated',
                previousBbsPublicKeyBase58: prevBbsPublicKeyBase58,
                bbsPublicKeyBase58: bbs,
            });

            await ctx.stub.putState(didID, Buffer.from(stringify(sortKeysRecursive(anchor))));
            return `DID for ${didID} updated.`;
        }

        const txId = ctx.stub.getTxID();
        const timestamp = ctx.stub.getTxTimestamp();
        const createdTimestamp = new Date(Number(timestamp.seconds) * 1000 + Math.round(timestamp.nanos / 1000000)).toISOString();
        const bbs = !bbsPublicKeyBase58 || bbsPublicKeyBase58 === "null" ? null : bbsPublicKeyBase58;

        const anchor: DID = {
            docType: 'DID',
            didID: didID,
            creator: callerMSPID,
            revoked: false,
            createdTimestamp,
            revokedTimestamp: null,
            publicKeyBase58,
            bbsPublicKeyBase58: bbs,
            serviceEndpoint,
            auditTrail: [{
                timestamp: createdTimestamp,
                revoked: false,
                txId,
                action: 'created',
                publicKeyBase58,
                bbsPublicKeyBase58: bbs,
                serviceEndpoint,
            }]
        };
        await ctx.stub.putState(didID, Buffer.from(stringify(sortKeysRecursive(anchor))));
        const createdMs = Date.parse(createdTimestamp);
        if (!Number.isFinite(createdMs)) throw new Error('Invalid createdTimestamp');
        const idxActiveKey = ctx.stub.createCompositeKey(IDX_ACTIVE, [anchor.creator, invTs(createdMs), didID]);
        await ctx.stub.putState(idxActiveKey, Buffer.from('\x00'));
        return `DID for ${didID} created.`;
    }

    @Transaction(false)
    @Returns('string')
    public async readDIDkey(ctx: Context, assetId: string): Promise<string> {
        const data = await ctx.stub.getState(assetId);
        if (!data || data.length === 0) throw new Error(`DID key ${assetId} does not exist`);
        //const anchor: DID = JSON.parse(data.toString());
        // if (anchor.revoked) throw new Error('DID key is revoked.');
        return data.toString();
    }

    @Transaction()
public async storeDIDDoc(ctx: Context, didID: string, didDocJson: string): Promise<string> {
  this.Cid = new ClientIdentity(ctx.stub);
  const callerMSPID = this.Cid.getMSPID().slice(0, -3);
  if (callerMSPID !== "Org1") throw new Error("Only an issuer can store a DID doc");

  if (await this.AssetExists(ctx, didID)) throw new Error(`DID ${didID} already exists`);

  let didDocument: any;
  try { didDocument = JSON.parse(didDocJson); } catch { throw new Error("Invalid didDocJson"); }
  if (didDocument?.id !== didID) throw new Error("didDocument.id must match didID");

  const txId = ctx.stub.getTxID();
  const ts = ctx.stub.getTxTimestamp();
  const createdTimestamp = new Date(Number(ts.seconds) * 1000 + Math.round(ts.nanos / 1e6)).toISOString();

  const record = {
    docType: "DID",
    didID,
    creator: callerMSPID,
    revoked: false,
    createdTimestamp,
    revokedTimestamp: null,
    didDocument,
    auditTrail: [{ timestamp: createdTimestamp, revoked: false, txId }],
  };

  await ctx.stub.putState(didID, Buffer.from(stringify(sortKeysRecursive(record))));
  return `DID doc for ${didID} created.`;
}


    // Revoke a DID key
    @Transaction()
    public async revokeDIDkey(ctx: Context, didID: string): Promise<string> {
        this.Cid = new ClientIdentity(ctx.stub);
        const callerMSPID = this.Cid.getMSPID().slice(0, -3);
        if (callerMSPID !== "Org1") throw new Error('Only an issuer can revoke a DID key');
        // 1. Fetch anchor
        const exists = await this.AssetExists(ctx, didID);
        if (!exists) {
            throw new Error(`DID ${didID} does not exist`);
        }
   
        const data = await ctx.stub.getState(didID);
        const anchor: DID = JSON.parse(data.toString());

        if (anchor.revoked) throw new Error('DID key already revoked.');

        // 2. Require createdTimestamp exists
        if (!anchor.createdTimestamp) throw new Error('Anchor missing creation timestamp.');
      // drop ACTIVE secondary index row (no-op if it never existed)
        try {
          const createdMs = Date.parse(anchor.createdTimestamp);
          if (!Number.isFinite(createdMs)) throw new Error('Invalid createdTimestamp');
          // const idxActiveKey = ctx.stub.createCompositeKey('IDX:DID:ACTIVE', [anchor.creator, invTs(createdMs), didID]);
          const idxActiveKey = ctx.stub.createCompositeKey(IDX_ACTIVE, [anchor.creator, invTs(createdMs), didID]);

          await ctx.stub.deleteState(idxActiveKey);
        } catch { /* ignore */ }
        // 3. Update revoked status, store revokedTimestamp
        anchor.revoked = true;
        const txId = ctx.stub.getTxID();
        const timestamp = ctx.stub.getTxTimestamp();
        const revokedTimestamp = new Date(Number(timestamp.seconds) * 1000 + Math.round(timestamp.nanos / 1000000)).toISOString();
        anchor.revokedTimestamp = revokedTimestamp;
        anchor.auditTrail = anchor.auditTrail || [];
        anchor.auditTrail.push({ timestamp: revokedTimestamp, revoked: true, txId });

        await ctx.stub.putState(didID, Buffer.from(stringify(sortKeysRecursive(anchor))));
        return `DID key ${didID} revoked at ${revokedTimestamp}`;
    }

    @Transaction(false)
    @Returns('string')
    public async latestActiveDid(ctx: Context, creator: string): Promise<string> {
      // const iter = await ctx.stub.getStateByPartialCompositeKey('IDX:DID:ACTIVE', [creator]);
      const iter = await ctx.stub.getStateByPartialCompositeKey(IDX_ACTIVE, [creator]);
      try {
        const r = await iter.next();
        if (r.done) throw new Error('No active DID for creator');
        const { attributes } = ctx.stub.splitCompositeKey(r.value.key);
        const didID = attributes[2];
        return await this.readDIDkey(ctx, didID);
      } finally {
        await iter.close();
      }
    }





    // Create a VC anchor asset: assetId = public key, vcHash, revoked=false
  @Transaction()
    public async CreateVcAnchor(
        ctx: Context, 
        assetId: string, 
        publicKeyPem: string, 
        // vcHash: string, 
        policyHash: string, 
        templateHash: string, 
        durationSecsStr: string,
        assuranceLevel: string | null = null,
        allowedPurposeJson: string = '[]',
        allowedOperationJson: string = '[]', 
        //accessRequestHash: string | null = null
    ): Promise<string> {

        const durationSecs = Number(durationSecsStr);
        if (!Number.isFinite(durationSecs) || durationSecs <= 0) {
            throw new Error('Invalid durationSecs');
        }

        const MAX_DURATION_SECS = Number(process.env.CONSENT_MAX_DURATION_SECS ?? 3 * 365 * 24 * 60 * 60);
        const clampedDuration = Math.min(durationSecs, MAX_DURATION_SECS);

        this.Cid = new ClientIdentity(ctx.stub);
        const callerMSPID = this.Cid.getMSPID().slice(0, -3);
        if (callerMSPID !== "Org1") throw new Error('Only an issuer can create a VC anchor');

        const exists = await this.AssetExists(ctx, assetId);
        if (exists) {
            throw new Error(`VC Anchor for assetId ${assetId} already exists`);
        }      
        // Hash the provided PEM public key to store as holderBindingHash
        // const holderBindingHash = crypto.createHash('sha256').update(publicKeyPem).digest('hex');
        assertEdDsaKey(publicKeyPem);
        const holderBindingHash = spkiDerSha256(publicKeyPem);


        let allowedPurpose: string[] = [];
        let allowedOperation: string[] = [];
        try { allowedPurpose  = JSON.parse(allowedPurposeJson)  ?? []; } catch {}
        try { allowedOperation = JSON.parse(allowedOperationJson) ?? []; } catch {}
        const allowedOperationHash = allowedOperation.map(op => crypto.createHash('sha256').update(op.trim().toLowerCase()).digest('hex'));
        const allowedPurposeHash = allowedPurpose.map(purpose => crypto.createHash('sha256').update(purpose.trim().toLowerCase()).digest('hex'));

        const txId = ctx.stub.getTxID();
        const timestamp = ctx.stub.getTxTimestamp();
        const createdDate = new Date(Number(timestamp.seconds) * 1000 + Math.round(timestamp.nanos / 1e6));
        const createdTimestamp = createdDate.toISOString();

        // ✅ proper date math
        const validUntil = new Date(createdDate.getTime() + clampedDuration * 1000).toISOString();


        const anchor: VcAnchor = {
            docType: 'vcAnchor',
            assetId,
            creator: callerMSPID,
            holderBindingHash,
            // vcHash,
            policyHash,
            templateHash,
            validUntil,
            status: 'active',
            assuranceLevel: assuranceLevel || undefined,
            allowedPurposeHash,
            allowedOperationHash,
            createdTimestamp,
            revokedTimestamp: null,
            auditTrail: [{
                timestamp: createdTimestamp,
                revoked: false,
                txId,
                //accessRequestHash: null,
                accessResult: null
            }]
        };

        await ctx.stub.putState(assetId, Buffer.from(stringify(sortKeysRecursive(anchor))));
        return `VC anchor for ${assetId} created.`;
    }


 

    // Update "revoked" field - caller must present signature over assetId using private key
    @Transaction()
    public async RevokeVc(ctx: Context, assetId: string, publicKeyPem: string, signature: string): Promise<string> {
        this.Cid = new ClientIdentity(ctx.stub);
        const callerMSPID = this.Cid.getMSPID().slice(0, -3);
        if (callerMSPID !== "Org2") throw new Error('Only a holder can revoke a VC anchor');

        // 1. Fetch anchor
        const exists = await this.AssetExists(ctx, assetId);
        if (!exists) {
            throw new Error(`VC Anchor ${assetId} does not exist`);
        }
        const data = await ctx.stub.getState(assetId);
        const anchor: VcAnchor = JSON.parse(data.toString());

        if (anchor.status !== 'active') throw new Error('VC anchor not active.');

        // Verify provided PEM matches stored hash
        // const providedHash = crypto.createHash('sha256').update(publicKeyPem).digest('hex');
        // if (providedHash !== anchor.holderBindingHash) {
        //     throw new Error('Provided public key does not match the bound hash.');
        // }
        // Verify provided key (SPKI DER hash) matches the bound hash
        assertEdDsaKey(publicKeyPem);
        const providedHash = spkiDerSha256(publicKeyPem);
        if (providedHash !== anchor.holderBindingHash) {
          throw new Error('Provided public key does not match the bound hash.');
        }


        // Verify signature over (assetId + createdTimestamp)
        const message = Buffer.from(assetId + '|' + anchor.createdTimestamp, 'utf8');
        const sig = Buffer.from(signature, 'base64');
        const ok = crypto.verify(null, message, publicKeyPem, sig);
        if (!ok) throw new Error('Signature invalid. Only private key holder can revoke.');

        // Update revoked status
        anchor.status = 'revoked'; 
        const txId = ctx.stub.getTxID();
        const timestamp = ctx.stub.getTxTimestamp();
        const revokedTimestamp = new Date(Number(timestamp.seconds) * 1000 + Math.round(timestamp.nanos / 1000000)).toISOString();
        anchor.revokedTimestamp = revokedTimestamp;
        anchor.auditTrail = anchor.auditTrail || [];
        anchor.auditTrail.push({ 
            timestamp: revokedTimestamp, 
            revoked: true, 
            txId,
            //accessRequestHash: null,
            accessResult: null
        });
        await ctx.stub.putState(assetId, Buffer.from(stringify(sortKeysRecursive(anchor))));
        return `VC anchor ${assetId} revoked at ${revokedTimestamp}`;
    }

    // Check existence
    @Transaction(false)
    @Returns('boolean')
    public async AssetExists(ctx: Context, assetId: string): Promise<boolean> {
        const data = await ctx.stub.getState(assetId);
        return !!data && data.length > 0;
    }


       // Read VC anchor asset
    @Transaction(false)
    @Returns('string')
    public async ReadVcAnchor(ctx: Context, assetId: string): Promise<string> {
        this.Cid = new ClientIdentity(ctx.stub);
        const callerMSPID = this.Cid.getMSPID().slice(0, -3);
        if (callerMSPID === "Org3") throw new Error('Verifiers need to use VerifyAndLogAccess function');
        const data = await ctx.stub.getState(assetId);
        if (!data || data.length === 0) throw new Error(`VC anchor ${assetId} does not exist`);
        return data.toString();
    }


    // List all VC anchors
    @Transaction(false)
    @Returns('string')
    public async GetAllVcAnchors(ctx: Context): Promise<string> {
        this.Cid = new ClientIdentity(ctx.stub);
        const callerMSPID = this.Cid.getMSPID().slice(0, -3);
        if (callerMSPID === "Org3") throw new Error('Verifiers cant use this function');
        const allResults = [];
        const iterator = await ctx.stub.getStateByRange('', '');
        let result = await iterator.next();
        while (!result.done) {
            const strValue = result.value.value.toString();
            let record;
            try { record = JSON.parse(strValue); } catch { record = strValue; }
            if (record.docType === 'vcAnchor') allResults.push(record);
            result = await iterator.next();
        }
        iterator.close();
        return JSON.stringify(allResults);
    }



    @Transaction()
    public async VerifyAndLogAccess(
        ctx: Context,
        assetId: string,
        accessRequestJson: string // {"purpose":["pcode001"],"operation":["ocode001"]}
        ): Promise<string> {         // <-- return JSON string
        this.Cid = new ClientIdentity(ctx.stub);
        if (this.Cid.getMSPID().slice(0, -3) !== "Org3") throw new Error('Only verifiers');

        const data = await ctx.stub.getState(assetId);
        if (!data || data.length === 0) throw new Error('Anchor not found');
        const anchor = JSON.parse(data.toString());

        const nowIso = new Date(Number(ctx.stub.getTxTimestamp().seconds) * 1000 + Math.round(ctx.stub.getTxTimestamp().nanos / 1e6)).toISOString();
        if (anchor.status === 'active' && nowIso > anchor.validUntil) {
            anchor.status = 'expired';
        }

        // Parse request safely
        let req: any = {};
        try { req = JSON.parse(accessRequestJson) || {}; } catch {}
        const toArray = (x: any) => Array.isArray(x) ? x : (x == null ? [] : [x]);

        const purposes  = toArray(req.purpose);
        const operations = toArray(req.operation);

        const norm = (s: string) => String(s).trim().toLowerCase();
        const hash = (s: string) => crypto.createHash('sha256').update(s).digest('hex');
        const reqPurposesHash   = purposes.map(p => hash(norm(p)));
        const reqOperationsHash = operations.map(o => hash(norm(o)));

        // Decision with reason
        let result = true;
        let reason: string | null = null;

        if (anchor.status !== 'active') {
            result = false;
            reason = anchor.status; // "revoked" | "expired"
        } else {
            const allowedPurposeHash   = anchor.allowedPurposeHash   ?? [];
            const allowedOperationHash = anchor.allowedOperationHash ?? [];

            const purposeOk = reqPurposesHash.length === 0
            ? true
            : reqPurposesHash.every(h => allowedPurposeHash.includes(h));

            const operationOk = reqOperationsHash.length === 0
            ? true
            : reqOperationsHash.every(h => allowedOperationHash.includes(h));

            if (!purposeOk && !operationOk) { result = false; reason = 'purpose_and_operation_not_allowed'; }
            else if (!purposeOk)             { result = false; reason = 'purpose_not_allowed'; }
            else if (!operationOk)           { result = false; reason = 'operation_not_allowed'; }
        }

    // Always log, with reason
    const txId = ctx.stub.getTxID();
    anchor.auditTrail.push({
        timestamp: nowIso,
        revoked: null,
        txId,
        accessResult: result,
        reason: reason
    });

    await ctx.stub.putState(assetId, Buffer.from(stringify(sortKeysRecursive(anchor))));
    ctx.stub.setEvent('AccessLogged', Buffer.from(JSON.stringify({
        assetId, accessResult: result, reason, timestamp: nowIso
    })));

    // Return a rich response
    const payload = {
        result,
        reason,                     // null on success; string on deny
        status: anchor.status,      // "active" | "revoked" | "expired"
        validUntil: anchor.validUntil
    };
    return JSON.stringify(payload);
    }

//     @Transaction()
// public async CreateVcAnchorV2(
//   ctx: Context,
//   assetId: string,
//   publicKeyPem: string,
//   policyHash: string,
//   templateHash: string,
//   durationSecsStr: string,
//   assuranceLevel: string | null,   // keep if you want on-chain reporting
//   templateVersion: string,         // e.g., "v3"
//   constraintsSetJson: string       // '["<atomHex>", "<atomHex>", ...]'
// ): Promise<string> {
//   const durationSecs = Number(durationSecsStr);
//   if (!Number.isFinite(durationSecs) || durationSecs <= 0) throw new Error('Invalid durationSecs');

//   const callerMSPID = new ClientIdentity(ctx.stub).getMSPID().slice(0, -3);
//   if (callerMSPID !== 'Org1') throw new Error('Only an issuer can create a VC anchor');

//   if (await this.AssetExists(ctx, assetId)) throw new Error(`VC Anchor ${assetId} exists`);

//   // parse & bound
//   let constraintsSet: string[] = [];
//   try { constraintsSet = JSON.parse(constraintsSetJson) ?? []; } catch {}
//   // dedupe + sort for determinism; cap size
//   constraintsSet = Array.from(new Set(constraintsSet)).sort();
//   if (constraintsSet.length > 64) throw new Error('Too many constraint atoms');

//   // const holderBindingHash = crypto.createHash('sha256').update(publicKeyPem).digest('hex');
//   const holderBindingHash = spkiDerSha256(publicKeyPem);
//   const ts = ctx.stub.getTxTimestamp();
//   const createdDate = new Date(Number(ts.seconds) * 1000 + Math.round(ts.nanos / 1e6));
//   const createdTimestamp = createdDate.toISOString();
//   const validUntil = new Date(createdDate.getTime() + durationSecs * 1000).toISOString();

//   const anchor: VcAnchor = {
//     docType: 'vcAnchor',
//     assetId,
//     creator: callerMSPID,
//     holderBindingHash,
//     policyHash,
//     templateHash,
//     validUntil,
//     status: 'active',
//     assuranceLevel: assuranceLevel || undefined,
//     constraintsSet,                 // <-- the generic, future-proof field
//     createdTimestamp,
//     revokedTimestamp: null,
//     auditTrail: [{
//       timestamp: createdTimestamp, revoked: false, txId: ctx.stub.getTxID(),
//       accessResult: null
//     }]
//   };

//   await ctx.stub.putState(assetId, Buffer.from(stringify(sortKeysRecursive(anchor))));
//   return `VC anchor for ${assetId} created.`;
// }

// @Transaction()
// public async VerifyAndLogAccessV2(
//   ctx: Context,
//   assetId: string,
//   accessRequestJson: string // {"purpose":[...],"operation":[...],"constraints":{...}}
// ): Promise<string> {        // return JSON
//   const cid = new ClientIdentity(ctx.stub);
//   this.Cid = new ClientIdentity(ctx.stub);
//   const callerMSPID = this.Cid.getMSPID().slice(0, -3);
//   if (callerMSPID !== 'Org3') throw new Error('Only verifiers');

//   const data = await ctx.stub.getState(assetId);
//   if (!data || data.length === 0) throw new Error('Anchor not found');
//   const anchor = JSON.parse(data.toString());

//   const ts = ctx.stub.getTxTimestamp();
//   const nowIso = new Date(Number(ts.seconds) * 1000 + Math.round(ts.nanos / 1e6)).toISOString();
//   if (anchor.status === 'active' && nowIso > anchor.validUntil) anchor.status = 'expired';

//   let req: any = {};
//   try { req = JSON.parse(accessRequestJson) || {}; } catch {}
//   const toArray = (x:any) => Array.isArray(x) ? x : (x == null ? [] : [x]);
//   const norm = (s:string)=> String(s).trim().toLowerCase();
//   const SEP = '\u001F';
//   const atom = (k:string, v:string)=> crypto.createHash('sha256').update(k + SEP + v).digest('hex');

//   // Build request atoms (subset we must satisfy)
//   const reqAtoms: string[] = [];
//   for (const p of toArray(req.purpose))   reqAtoms.push(atom('purpose',   norm(p)));
//   for (const o of toArray(req.operation)) reqAtoms.push(atom('operation', norm(o)));
//   if (req.constraints && typeof req.constraints === 'object') {
//     for (const [k,v] of Object.entries(req.constraints)) {
//       // canonicalize simple values. If arrays appear, emit per-item atoms instead.
//       const val = typeof v === 'string' ? norm(v) : JSON.stringify(v);
//       reqAtoms.push(atom(String(k), val));
//     }
//   }

//   // Decision + reasons
//   let result = true;
//   let reason: string | null = null;

//   if (anchor.status !== 'active') {
//     result = false; reason = anchor.status; // 'revoked' | 'expired'
//   } else {
//     const set: Set<string> = new Set(anchor.constraintsSet ?? []);
//     const allIn = reqAtoms.every(a => set.has(a));
//     if (!allIn) { result = false; reason = 'atoms_not_allowed'; }
//   }

//   // Always log (store only hashes, no raw keys/values)
//   anchor.auditTrail.push({
//     timestamp: nowIso, revoked: null, txId: ctx.stub.getTxID(),
//     accessResult: result,
//     purpose: null, operation: null, // optional: keep null as we now log atoms generically
//     // you can add: constraintsAtoms: reqAtoms
//   });

//   await ctx.stub.putState(assetId, Buffer.from(stringify(sortKeysRecursive(anchor))));
//   ctx.stub.setEvent('AccessLogged', Buffer.from(JSON.stringify({ assetId, accessResult: result, reason, timestamp: nowIso })));

//   return JSON.stringify({
//     result, reason, status: anchor.status, validUntil: anchor.validUntil
//   });
// }




    // // Private helper: Append log
    // private _logAccess(ctx: Context, anchor: VcAnchor, assetId: string, accessRequestHash: string, accessResult: boolean): void {
    //     const txId = ctx.stub.getTxID();
    //     const txTimestamp = ctx.stub.getTxTimestamp();
    //     const timestamp = new Date(Number(txTimestamp.seconds) * 1000 + Math.round(txTimestamp.nanos / 1000000)).toISOString();

    //     anchor.auditTrail.push({ 
    //         timestamp, 
    //         revoked: null,
    //         txId,
    //         //accessRequestHash,
    //         accessResult 
    //     });
    //     ctx.stub.putState(assetId, Buffer.from(stringify(sortKeysRecursive(anchor))));

    //     // Emit event for WP5
    //     ctx.stub.setEvent('AccessLogged', Buffer.from(JSON.stringify({ assetId, accessResult, timestamp })));
    // }
}
