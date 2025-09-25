import * as nano from 'nano'; // Ensure @types/nano installed: npm i @types/nano
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
}

let db: nano.DocumentScope<PolicyDocument>;

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
    console.log('CouchDB connected');
  } catch (error: unknown) {
    console.error('CouchDB error:', error);
    // Don't exit on startup if you prefer to keep the API running without off-chain storage
    // process.exit(1);
  }
}

initDb();


initDb(); // Startup init

export async function savePolicy(policyHash: string, policyJson: string, templateHash?: string) {
  try {
    const doc: PolicyDocument = {
      _id: policyHash, // Use hash as _id (unique)
      policyJson,
      createdAt: new Date().toISOString()
    };
     if (templateHash) doc.templateHash = templateHash; 
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