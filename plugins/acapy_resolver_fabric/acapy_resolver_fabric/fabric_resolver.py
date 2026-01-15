import os
import re
from typing import Pattern, Optional, Sequence, Text

import aiohttp

from acapy_agent.resolver.base import BaseDIDResolver, ResolverType, DIDNotFound

# Base58 alphabet (Bitcoin Base58):
# - Used widely for keys/DIDs because it avoids ambiguous characters:
#   excludes 0, O, I, l
# - This exact alphabet order defines the mapping char<->value (0..57)
BASE58_ALPHABET = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz"


def base58_decode(data: str) -> bytes:
    """
    Decode a Base58 string -> raw bytes using BASE58_ALPHABET.

    Notes:
    - Each char maps to a digit in base-58.
    - Leading '1' characters represent leading 0x00 bytes (padding).
    """
    num = 0
    for char in data:
        num *= 58
        num += BASE58_ALPHABET.index(char)

    # Convert big integer to big-endian bytes
    full = num.to_bytes((num.bit_length() + 7) // 8, "big")

    # Preserve leading zeros: Base58 uses '1' as "zero byte" padding
    n_pad = len(data) - len(data.lstrip("1"))
    return b"\x00" * n_pad + full


def base58_encode(b: bytes) -> str:
    """
    Encode raw bytes -> Base58 string using BASE58_ALPHABET.

    Notes:
    - Convert bytes to big integer, then repeatedly mod/div by 58.
    - Leading 0x00 bytes become leading '1' characters.
    """
    num = int.from_bytes(b, "big")
    chars = ""
    while num > 0:
        num, rem = divmod(num, 58)
        chars = BASE58_ALPHABET[rem] + chars

    # Preserve leading 0x00 bytes as leading '1'
    n_pad = len(b) - len(b.lstrip(b"\x00"))
    return ("1" * n_pad) + chars


def to_did_key_ed25519(verkey_b58: str) -> str:
    """
    Convert an Ed25519 public key (Base58) into a did:key identifier.

    Steps:
    1) Base58-decode the Ed25519 public key -> raw 32 bytes
    2) Prefix with the multicodec header for ed25519-pubkey (0xED 0x01)
    3) Base58-encode and add the did:key:z prefix

    Result: did:key:z...
    """
    raw = base58_decode(verkey_b58)

    # multicodec prefix for ed25519-pubkey
    # (ed25519-pubkey = 0xED, varint -> 0xED 0x01)
    prefixed = b"\xed\x01" + raw
    return "did:key:z" + base58_encode(prefixed)


class FabricResolver(BaseDIDResolver):
    def __init__(self):
        # NON_NATIVE: this resolver is not built into ACA-Py core, it's plugin-provided
        super().__init__(ResolverType.NON_NATIVE)

        # Only handle DIDs that start with did:fabric:
        self._supported_did_regex = re.compile(r"^did:fabric:.*$")

        # Base URL of your external resolver service (Node/Express)
        # e.g. http://host.docker.internal:8000/fabric-did
        self._registry_url: str = ""

    @property
    def supported_did_regex(self) -> Pattern:
        return self._supported_did_regex

    async def setup(self, context):
        """
        Called once when ACA-Py starts and loads the plugin.
        We read configuration either from ACA-Py settings or env.
        """
        # You can also pass this via --plugin-config and read from context.settings
        self._registry_url = (
            context.settings.get("fabric_resolver.url")
            or os.getenv("FABRIC_RESOLVER_URL", "")
        ).rstrip("/")

    async def _resolve(
        self,
        profile,
        did: str,
        service_accept: Optional[Sequence[Text]] = None,
    ) -> dict:
        """
        Resolve did:fabric:* by calling your external resolver:
          GET {FABRIC_RESOLVER_URL}/resolve?did=<did>

        Then normalize the returned DID Document into an ACA-Py friendly shape
        (with did-communication service and recipientKeys referencing #keys-1).
        """
        if not self._registry_url:
            raise DIDNotFound("FABRIC_RESOLVER_URL (or fabric_resolver.url) is not set")

        # Expect your service to support: GET {base}/resolve?did=<did>
        url = f"{self._registry_url}/resolve"

        # Call upstream resolver
        async with aiohttp.ClientSession() as session:
            async with session.get(url, params={"did": did}) as resp:
                if resp.status == 404:
                    raise DIDNotFound(f"DID not found: {did}")
                if resp.status >= 400:
                    text = await resp.text()
                    raise DIDNotFound(f"Resolver upstream error {resp.status}: {text}")
                data = await resp.json()

        # Option A: upstream returns { didDocument: { ... } }
        if "didDocument" in data and isinstance(data["didDocument"], dict):
            doc = data["didDocument"]

            # Extract the main Ed25519 public key (Base58) from verificationMethod
            pk = None
            for vm in doc.get("verificationMethod", []):
                if vm.get("id", "").endswith("#keys-1") and vm.get("publicKeyBase58"):
                    pk = vm["publicKeyBase58"]
                    break
            if not pk:
                # fallback: some upstream formats might put it at top-level
                pk = doc.get("publicKeyBase58")

            # Extract a service endpoint (string or {uri: ...})
            endpoint = None
            for svc in doc.get("service", []):
                se = svc.get("serviceEndpoint")
                if isinstance(se, dict) and "uri" in se:
                    endpoint = se.get("uri")
                elif isinstance(se, str):
                    endpoint = se
                if endpoint:
                    break
            if not endpoint and doc.get("service"):
                # fallback to first service endpoint
                se = doc["service"][0].get("serviceEndpoint")
                if isinstance(se, str):
                    endpoint = se
                elif isinstance(se, dict):
                    endpoint = se.get("uri")

            if not pk or not endpoint:
                raise DIDNotFound(f"Incomplete DID data for {did}: {data}")

            # Canonicalize to a DIDDoc shape ACA-Py expects for DIDComm routing:
            # - service type "did-communication"
            # - recipientKeys references a DID URL (#keys-1), not raw base58
            canonical = {
                "@context": [
                    "https://www.w3.org/ns/did/v1",
                ],
                "id": did,

                # Some stacks still look for "publicKey" (legacy) in addition to "verificationMethod"
                "publicKey": [{
                    "id": f"{did}#keys-1",
                    "type": "Ed25519VerificationKey2018",
                    "controller": did,
                    "publicKeyBase58": pk,
                }],
                "verificationMethod": [{
                    "id": f"{did}#keys-1",
                    "type": "Ed25519VerificationKey2018",
                    "controller": did,
                    "publicKeyBase58": pk,
                }],
                "authentication": [f"{did}#keys-1"],
                "service": [{
                    "id": f"{did}#did-communication",
                    "type": "did-communication",
                    "priority": 0,
                    "recipientKeys": [f"{did}#keys-1"],
                    "routingKeys": [],
                    "serviceEndpoint": endpoint,
                    # Optional hints of DIDComm formats you can accept
                    "accept": [
                        "didcomm/aip2;env=rfc19",
                        "didcomm/aip1",
                        "didcomm/v2",
                    ],
                }],
            }

            # Carry over optional BLS/BBS key if present in upstream DIDDoc
            for vm in doc.get("verificationMethod", []):
                if vm.get("type") == "Bls12381G2Key2020" and vm.get("publicKeyBase58"):
                    bbs_vm = {
                        "id": f"{did}#bbs-1",
                        "type": "Bls12381G2Key2020",
                        "controller": did,
                        "publicKeyBase58": vm["publicKeyBase58"],
                    }
                    canonical.setdefault("publicKey", []).append(bbs_vm)
                    canonical.setdefault("verificationMethod", []).append(bbs_vm)
                    canonical["assertionMethod"] = [f"{did}#bbs-1"]
                    break

            return canonical

        # Option B: upstream returns flat fields { publicKeyBase58, serviceEndpoint, ... }
        pk = data.get("publicKeyBase58")
        endpoint = data.get("serviceEndpoint")

        if not pk or not endpoint:
            raise DIDNotFound(f"Incomplete DID data for {did}: {data}")

        canonical = {
            "@context": [
                "https://www.w3.org/ns/did/v1",
            ],
            "id": did,
            "publicKey": [{
                "id": f"{did}#keys-1",
                "type": "Ed25519VerificationKey2018",
                "controller": did,
                "publicKeyBase58": pk,
            }],
            "verificationMethod": [{
                "id": f"{did}#keys-1",
                "type": "Ed25519VerificationKey2018",
                "controller": did,
                "publicKeyBase58": pk,
            }],
            "authentication": [f"{did}#keys-1"],
            "service": [{
                "id": f"{did}#did-communication",
                "type": "did-communication",
                "priority": 0,
                "recipientKeys": [f"{did}#keys-1"],
                "routingKeys": [],
                "serviceEndpoint": endpoint,
                "accept": [
                    "didcomm/aip2;env=rfc19",
                    "didcomm/aip1",
                    "didcomm/v2",
                ],
            }],
        }

        # Optional BBS key support when upstream returns it flat
        if data.get("bbsPublicKeyBase58"):
            bbs_vm = {
                "id": f"{did}#bbs-1",
                "type": "Bls12381G2Key2020",
                "controller": did,
                "publicKeyBase58": data["bbsPublicKeyBase58"],
            }
            canonical.setdefault("publicKey", []).append(bbs_vm)
            canonical.setdefault("verificationMethod", []).append(bbs_vm)
            canonical["assertionMethod"] = [f"{did}#bbs-1"]

        return canonical
