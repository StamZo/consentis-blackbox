import * as nano from 'nano'; // Ensure @types/nano installed: npm i @types/nano
import * as crypto from 'crypto';
// docker run -d --name consentis-couch \
//   -e COUCHDB_USER=admin \
//   -e COUCHDB_PASSWORD=secret \
//   -p 15984:5984 couchdb:3
//http://localhost:15984/_utils/




const DB_NAME = process.env.COUCHDB_DB || 'consentis_offchain';
const HOST    = process.env.COUCHDB_HOST || 'localhost';
const PORT    = Number(process.env.COUCHDB_PORT || 15984);
const username    = process.env.COUCHDB_USER || 'admin';
const password    = process.env.COUCHDB_PASSWORD || 'secret';

// Use auth object instead of embedding creds in the URL
const couch = nano.default({
  url: `http://${HOST}:${PORT}`,
  requestDefaults: {
    auth: { username, password }
  }
});

interface PolicyDocument {
  _id: string;
  policyJson: string;
  createdAt: string;
  templateHash?: string;
  templateVersion?: string;
}

interface ContractDescriptorDocument {
  _id: string;
  docType: 'contractDescriptor';
  descriptorHash: string;
  descriptorJson: any;
  policyHash: string;
  templateHash?: string;
  templateVersion?: string;
  datasetIds: string[];
  purposes: string[];
  operations: string[];
  durationSecs?: number;
  assuranceLevel?: string | null;
  issuerOrgId?: string | null;
  createdAt: string;
}

interface AuditEventDocument {
  _id: string;
  docType: 'auditEvent';
  consentId: string;
  policyHash?: string;
  requesterOrg?: string | null;
  purposes?: string[];
  operations?: string[];
  result?: boolean;
  reason?: string | null;
  txId?: string | null;
  createdAt: string;
}

let db: nano.DocumentScope<any>;

const nowIso = () => new Date().toISOString();
const makeId = (prefix: string) =>
  `${prefix}:${Date.now()}:${crypto.randomBytes(6).toString('hex')}`;

async function ensureIndexes() {
  if (!db) return;
  const indexes = [
    { name: 'docType', fields: ['docType'] },
    { name: 'docType_policyHash', fields: ['docType', 'policyHash'] },
    { name: 'docType_descriptorHash', fields: ['docType', 'descriptorHash'] },
    { name: 'docType_datasetIds', fields: ['docType', 'datasetIds'] },
    { name: 'docType_purposes', fields: ['docType', 'purposes'] },
    { name: 'docType_operations', fields: ['docType', 'operations'] },
    { name: 'docType_consentId', fields: ['docType', 'consentId'] },
    { name: 'docType_createdAt', fields: ['docType', 'createdAt'] }
  ];
  for (const idx of indexes) {
    try {
      await db.createIndex({ index: { fields: idx.fields }, name: idx.name });
    } catch {
      // ignore index creation errors (e.g., already exists)
    }
  }
}

async function initDb() {
  try {
    const dbName = DB_NAME;

    // Try to create, but ignore "already exists"
    try {
      await couch.db.create(dbName);
      console.log(`CouchDB created: ${dbName}`);
    } catch (e: any) {
      if (e?.statusCode === 412 || e?.error === 'file_exists') {
        console.log(`CouchDB exists: ${dbName}`);
      } else {
        throw e; // rethrow other errors
      }
    }

    db = couch.use(dbName);
    await ensureIndexes();
    console.log('CouchDB connected');
  } catch (error: unknown) {
    console.error('CouchDB error:', error);
    // Don't exit on startup if you prefer to keep the API running without off-chain storage
    // process.exit(1);
  }
}

initDb();

export async function savePolicy(policyHash: string, policyJson: string, templateHash?: string, templateVersion?: string) {
  try {
    const doc: PolicyDocument = {
      _id: policyHash, // Use hash as _id (unique)
      policyJson,
      createdAt: new Date().toISOString()
    };
     if (templateHash) doc.templateHash = templateHash; 
     if (templateVersion) doc.templateVersion = templateVersion;
    const response = await db.insert(doc);
    console.log(`Policy saved: ${policyHash}, rev: ${response.rev}`);
  } catch (error: unknown) {
    console.error('Save policy error:', error);
    throw error;
  }
}

export async function getPolicyByHash(policyHash: string) {
  try {
    const doc = await db.get(policyHash); // Type assertion for expiresAt
    // Check expiry (manual soft delete)
    // if (new Date() > new Date(doc.expiresAt)) {
    //   await deletePolicyByHash(policyHash);
    //   return null; // Expired
    // }
    return doc;
  } catch (error: any) {
    if (error.statusCode === 404) return null;
    throw error;
  }
}

export async function deletePolicyByHash(policyHash: string) {
  try {
    const doc = await db.get(policyHash);
    await db.destroy(policyHash, doc._rev);
    console.log(`Policy deleted: ${policyHash}`);
  } catch (error: unknown) {
    console.error('Delete error:', error);
    throw error;
  }
}

export async function saveContractDescriptor(input: Omit<ContractDescriptorDocument, '_id' | 'docType' | 'createdAt'> & { _id?: string }) {
  const _id = input._id || `contract:${input.descriptorHash}`;
  try {
    const existing = await db.get(_id);
    return existing;
  } catch (e: any) {
    if (e?.statusCode !== 404) throw e;
  }
  const doc: ContractDescriptorDocument = {
    _id,
    docType: 'contractDescriptor',
    descriptorHash: input.descriptorHash,
    descriptorJson: input.descriptorJson,
    policyHash: input.policyHash,
    templateHash: input.templateHash,
    templateVersion: input.templateVersion,
    datasetIds: input.datasetIds,
    purposes: input.purposes,
    operations: input.operations,
    durationSecs: input.durationSecs,
    assuranceLevel: input.assuranceLevel ?? null,
    issuerOrgId: input.issuerOrgId ?? null,
    createdAt: nowIso()
  };
  await db.insert(doc);
  return doc;
}

export async function getContractDescriptorByHash(descriptorHash: string) {
  const id = `contract:${descriptorHash}`;
  try {
    return await db.get(id);
  } catch (e: any) {
    if (e?.statusCode === 404) return null;
    throw e;
  }
}

export async function findContractDescriptors(filters: {
  datasetId?: string;
  purpose?: string;
  operation?: string;
  issuerOrgId?: string;
  templateVersion?: string;
  limit?: number;
}) {
  const selector: any = { docType: 'contractDescriptor' };
  if (filters.datasetId) selector.datasetIds = { $in: [filters.datasetId] };
  if (filters.purpose) selector.purposes = { $in: [filters.purpose] };
  if (filters.operation) selector.operations = { $in: [filters.operation] };
  if (filters.issuerOrgId) selector.issuerOrgId = filters.issuerOrgId;
  if (filters.templateVersion) selector.templateVersion = filters.templateVersion;

  const res = await db.find({ selector, limit: filters.limit || 200 });
  return res.docs || [];
}

export async function saveAuditEvent(input: Omit<AuditEventDocument, '_id' | 'docType' | 'createdAt'> & { _id?: string }) {
  const doc: AuditEventDocument = {
    _id: input._id || makeId('audit'),
    docType: 'auditEvent',
    consentId: input.consentId,
    policyHash: input.policyHash,
    requesterOrg: input.requesterOrg ?? null,
    purposes: input.purposes ?? [],
    operations: input.operations ?? [],
    result: input.result,
    reason: input.reason ?? null,
    txId: input.txId ?? null,
    createdAt: nowIso()
  };
  await db.insert(doc);
  return doc;
}

export async function listAuditEvents(consentId: string, limit = 200) {
  const res = await db.find({
    selector: { docType: 'auditEvent', consentId },
    limit
  });
  return res.docs || [];
}

// consent evidence/history removed (optional GA coverage; use ACA-Py/chain instead)
