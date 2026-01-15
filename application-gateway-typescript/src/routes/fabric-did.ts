import { Router } from "express";
import { readDIDkeyFromFabric } from "../services/ledger";

const router = Router();

// Minimal base58 helpers (avoid adding a dependency)
const BASE58_ALPHABET =
  "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
function base58Decode(input: string): Uint8Array {
  const bytes = [0];
  for (const char of input) {
    const value = BASE58_ALPHABET.indexOf(char);
    if (value < 0) throw new Error("Invalid base58 character");
    for (let i = 0; i < bytes.length; i++) {
      bytes[i] *= 58;
    }
    bytes[0] += value;
    let carry = 0;
    for (let j = 0; j < bytes.length; ++j) {
      bytes[j] += carry;
      carry = bytes[j] >> 8;
      bytes[j] &= 0xff;
    }
    while (carry) {
      bytes.push(carry & 0xff);
      carry >>= 8;
    }
  }
  // deal with leading zeros
  for (const char of input) {
    if (char === "1") {
      bytes.push(0);
    } else {
      break;
    }
  }
  return new Uint8Array(bytes.reverse());
}

function base58Encode(bytes: Uint8Array): string {
  if (bytes.length === 0) return "";
  const digits = [0];
  for (const byte of bytes) {
    for (let i = 0; i < digits.length; i++) {
      digits[i] <<= 8;
    }
    digits[0] += byte;
    let carry = 0;
    for (let i = 0; i < digits.length; ++i) {
      digits[i] += carry;
      carry = (digits[i] / 58) | 0;
      digits[i] %= 58;
    }
    while (carry) {
      digits.push(carry % 58);
      carry = (carry / 58) | 0;
    }
  }
  for (const byte of bytes) {
    if (byte === 0) {
      digits.push(0);
    } else {
      break;
    }
  }
  return digits
    .reverse()
    .map((d) => BASE58_ALPHABET[d])
    .join("");
}

function toDidKeyEd25519(verkeyBase58: string): string {
  // multicodec prefix for ed25519 public key = 0xed 0x01
  const raw = base58Decode(verkeyBase58);
  const prefixed = new Uint8Array(raw.length + 2);
  prefixed.set([0xed, 0x01]);
  prefixed.set(raw, 2);
  const encoded = base58Encode(prefixed);
  return `did:key:z${encoded}`;
}

router.get("/resolve", async (req, res) => {
  try {
    const did = String(req.query.did || "");
    if (!did) return res.status(400).json({ error: "missing_did" });
    // ✅ fallback for resolver calls (no headers, no auth)
    const payload = (req as any).userPayload ?? {};
    if (!payload.selected_peer || Number.isNaN(Number(payload.selected_peer))) {
      payload.selected_peer = "1";
    }

    // adapt keys to your code
    // Accept both did:fabric:* and did:key:* for flexibility
    if (!did.startsWith("did:fabric:") && !did.startsWith("did:key:")) {
      return res.status(400).json({ error: "unsupported_did", did });
    }

    // Query Fabric for the DID data
    const rawOut = await readDIDkeyFromFabric(payload, did);
    const raw =
      typeof rawOut === "string" ? JSON.parse(rawOut) : rawOut || {};

    const pk = raw.publicKeyBase58;
    const endpoint = raw.serviceEndpoint;

    if (!pk) {
      return res
        .status(404)
        .json({ error: "did_not_found_or_incomplete", raw });
    }

    // choose key type dynamically
    // const keyType = pk.length > 50 ? "Bls12381G2Key2020" : "Ed25519VerificationKey2018";

    // Build DID Document
    const didDocument: any = {
      "@context": "https://w3id.org/did/v1",
      id: did,
      publicKey: [
        {
          id: `${did}#keys-1`,
          type: "Ed25519VerificationKey2018",
          controller: did,
          publicKeyBase58: pk,
        },
      ],
      verificationMethod: [
        {
          id: `${did}#keys-1`,
          type: "Ed25519VerificationKey2018",
          controller: did,
          publicKeyBase58: pk,
        },
      ],
      authentication: [`${did}#keys-1`],
    };

    // add BBS/BLS key if present
    if (raw.bbsPublicKeyBase58) {
      const bbsEntry = {
        id: `${did}#bbs-1`,
        type: "Bls12381G2Key2020",
        controller: did,
        publicKeyBase58: raw.bbsPublicKeyBase58,
      };
      didDocument.publicKey.push(bbsEntry);
      didDocument.verificationMethod.push(bbsEntry);
      didDocument.assertionMethod = [`${did}#bbs-1`];
    }

    
    // only DIDComm DIDs have endpoints
    if (endpoint) {
      const didKey = toDidKeyEd25519(pk);
      didDocument.service = [
        {
          id: `${did}#did-communication`,
          type: "did-communication",
          priority: 0,
          // include both raw verkey and did:key for compatibility across AIP1/AIP2/v2
          recipientKeys: [pk, didKey],
          routingKeys: [],
          serviceEndpoint: endpoint,
          accept: ["didcomm/aip2;env=rfc19", "didcomm/aip1", "didcomm/v2"],
        },
        {
          id: `${did}#didcomm-1`,
          type: "DIDCommMessaging",
          serviceEndpoint: {
            uri: endpoint,
            accept: ["didcomm/v2"],
            routingKeys: [],
          },
          recipientKeys: [didKey],
          routingKeys: [],
        },
      ];
    }

    return res.json({ didDocument });
  } catch (err: any) {
    console.error("resolve error:", err);
    return res
      .status(500)
      .json({ error: err?.message || "resolver_internal_error" });
  }
});

export default router;
