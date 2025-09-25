import * as nodeCrypto from 'crypto';

function toBuf(x: any): Buffer { return Buffer.isBuffer(x) ? x : Buffer.from(x); }

function hkdf32(ikm: Buffer, info: string): Buffer {
  const salt = Buffer.alloc(0);
  if ((nodeCrypto as any).hkdfSync) {
    return toBuf((nodeCrypto as any).hkdfSync('sha256', ikm, salt, Buffer.from(info, 'utf8'), 32));
  }
  return nodeCrypto.createHash('sha256').update(ikm).update(info, 'utf8').digest() as Buffer;
}

function parseSeed(input: string | Buffer): Buffer {
  if (Buffer.isBuffer(input)) return input;
  const s = input.trim();
  const b64 = s.startsWith('b64:') ? s.slice(4) : s;
  try {
    const dec = Buffer.from(b64, 'base64');
    if (dec.length > 0 && dec.toString('base64').replace(/=+$/,'') === b64.replace(/=+$/,'')) return dec;
  } catch {}
  return Buffer.from(s, 'utf8');
}

export function deriveEd25519FromSeed(seed: string | Buffer, assetId: string) {
  const ikm    = parseSeed(seed);
  const edSeed = toBuf(hkdf32(ikm, 'vc:' + assetId));  // 32 bytes

  // PKCS#8 (RFC 8410) wrapper for raw seed
  const pkcs8Header = Buffer.from('302e020100300506032b657004220420', 'hex');
  const pkcs8Der    = Buffer.concat([pkcs8Header, edSeed]);

  const privKey = nodeCrypto.createPrivateKey({ key: pkcs8Der, format: 'der', type: 'pkcs8' });
  const pubKey  = nodeCrypto.createPublicKey(privKey);

  return {
    privateKeyPem: privKey.export({ format: 'pem', type: 'pkcs8' }).toString(),
    publicKeyPem:  pubKey.export({ format: 'pem',  type: 'spki'  }).toString(),
    alg: 'Ed25519'
  };
}

export function signVcAnchorAction(assetId: string, timestamp: string, privateKeyPem: string) {
  const toSign = `${assetId}|${timestamp}`;
  const keyObj = nodeCrypto.createPrivateKey(privateKeyPem);
  const sig    = nodeCrypto.sign(null, Buffer.from(toSign, 'utf8'), keyObj); // Ed25519 raw
  return { assetId, timestamp, signature: sig.toString('base64'), toSign, alg: 'Ed25519' };
}
