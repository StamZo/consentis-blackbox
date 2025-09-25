// /*
//   SPDX-License-Identifier: Apache-2.0
// */
// //npm run build FOR ANY CHANGE TO TAKE EFFECT!!

// import { Context, Contract, Info, Transaction, Returns } from 'fabric-contract-api';
// import stringify from 'json-stringify-deterministic';
// import sortKeysRecursive from 'sort-keys-recursive';
// import { ClientIdentity,} from 'fabric-shim';
// import { VcAnchor, AuditEvent } from './asset'; // <-- Your updated asset.ts

// @Info({ title: 'VcAnchorContract', description: 'Smart contract for anchoring VCs with revocation by private key' })
// export class VcAnchorContract extends Contract {
//     Cid:any;

//     // Create a VC anchor asset: assetId = public key, vcHash, revoked=false
//     @Transaction()
//     public async CreateVcAnchor(ctx: Context, assetId: string, publicKeyPem: string, vcHash: string): Promise<string> {
//     const exists = await this.VcAnchorExists(ctx, assetId);
//     if (exists) {
//         throw new Error(`VC Anchor for assetId ${assetId} already exists`);
//     }

//     this.Cid = new ClientIdentity(ctx.stub);
//     const callerMSPID = this.Cid.getMSPID().slice(0, -3);

//     const txId = ctx.stub.getTxID();
//     const timestamp = ctx.stub.getTxTimestamp();
//     const createdTimestamp = new Date(Number(timestamp.seconds) * 1000 + Math.round(timestamp.nanos / 1000000)).toISOString();

//     const anchor: VcAnchor = {
//         docType: 'vcAnchor',
//         assetId,
//         creator: callerMSPID,
//         publicKeyPem,
//         vcHash,
//         revoked: false,
//         createdTimestamp, // <-- store creation timestamp
//         revokedTimestamp: null, // <-- null at creation
//         auditTrail: [{ timestamp: createdTimestamp, revoked: false, txId }]
//     };

//     await ctx.stub.putState(assetId, Buffer.from(stringify(sortKeysRecursive(anchor))));
//     return `VC anchor for ${assetId} created.`;
//     }

//     // Read VC anchor asset
//     @Transaction(false)
//     @Returns('string')
//     public async ReadVcAnchor(ctx: Context, assetId: string): Promise<string> {
//         const data = await ctx.stub.getState(assetId);
//         if (!data || data.length === 0) throw new Error(`VC anchor ${assetId} does not exist`);
//         return data.toString();
//     }

//     // Update "revoked" field - caller must present signature over assetId using private key
//     @Transaction()
//     public async RevokeVc(ctx: Context, assetId: string, signature: string): Promise<string> {
//         // 1. Fetch anchor
//         const data = await ctx.stub.getState(assetId);
//         if (!data || data.length === 0) throw new Error(`VC anchor ${assetId} does not exist`);
//         const anchor: VcAnchor = JSON.parse(data.toString());

//         if (anchor.revoked) throw new Error('VC anchor already revoked.');

//         // 2. Require createdTimestamp exists
//         if (!anchor.createdTimestamp) throw new Error('Anchor missing creation timestamp.');

//         // 3. Verify signature: sign over (assetId + createdTimestamp)
//         const crypto = require('crypto');
//         const verifier = crypto.createVerify('SHA256');
//         verifier.update(assetId + '|' + anchor.createdTimestamp);
//         verifier.end();
//         const pubKey = anchor.publicKeyPem;
//         const isValid = verifier.verify(pubKey, Buffer.from(signature, 'base64'));
//         if (!isValid) throw new Error('Signature invalid. Only private key holder can revoke.');

//         // 4. Update revoked status, store revokedTimestamp
//         anchor.revoked = true;
//         const txId = ctx.stub.getTxID();
//         const timestamp = ctx.stub.getTxTimestamp();
//         const revokedTimestamp = new Date(Number(timestamp.seconds) * 1000 + Math.round(timestamp.nanos / 1000000)).toISOString();
//         anchor.revokedTimestamp = revokedTimestamp;
//         anchor.auditTrail = anchor.auditTrail || [];
//         anchor.auditTrail.push({ timestamp: revokedTimestamp, revoked: true, txId });

//     await ctx.stub.putState(assetId, Buffer.from(stringify(sortKeysRecursive(anchor))));
//     return `VC anchor ${assetId} revoked at ${revokedTimestamp}`;
// }

//     // Check existence
//     @Transaction(false)
//     @Returns('boolean')
//     public async VcAnchorExists(ctx: Context, assetId: string): Promise<boolean> {
//         const data = await ctx.stub.getState(assetId);
//         return !!data && data.length > 0;
//     }

//     // List all VC anchors
//     @Transaction(false)
//     @Returns('string')
//     public async GetAllVcAnchors(ctx: Context): Promise<string> {
//         const allResults = [];
//         const iterator = await ctx.stub.getStateByRange('', '');
//         let result = await iterator.next();
//         while (!result.done) {
//             const strValue = result.value.value.toString();
//             let record;
//             try { record = JSON.parse(strValue); } catch { record = strValue; }
//             if (record.docType === 'vcAnchor') allResults.push(record);
//             result = await iterator.next();
//         }
//         iterator.close();
//         return JSON.stringify(allResults);
//     }
// }
