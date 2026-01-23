# Consentis Consent VC Demo – Multitenant Aries + Fabric

This demo exposes a REST API on **`http://localhost:8000`** that orchestrates:

- **Org1 – Issuer** (Consentis): single-tenant ACA-Py agent, DID anchored on Fabric  
- **Org2 – Holders**: multitenant ACA-Py agent (one tenant per patient/subject)  
- **Org3 – Verifiers**: multitenant ACA-Py agent (one tenant per doctor/verifier)

The API wraps all ACA-Py and Fabric calls behind higher-level endpoints:

- Tenant management (JWTs per holder/verifier)
- DID bootstrap (issuer anchoring on Fabric)
- Connection setup (Issuer–Holder, Holder–Verifier)
- Consent request (proof request) from Verifier
- Consent issuance (VC) by Holder
- Consent presentation / denial
- On-chain consent verification
- Consent revocation (seed / external signature / private key)

---

## 1. Base URL, peers and headers

All endpoints are served by the API at:

```text
http://localhost:8000
```

Three internal “peers” are exposed via a header:

- **`x-selected-peer: Issuer`** → Org1 Issuer agent (single tenant)
- **`x-selected-peer: Holder`** → Org2 Holder multitenant agent
- **`x-selected-peer: Verifier`** → Org3 Verifier multitenant agent

For **multitenant** agents (peers 2 and 3) you also need a tenant JWT:

```http
Authorization: Bearer <tenant_jwt>
x-selected-peer: holder    # holder tenant
# or
x-selected-peer: verifier    # verifier tenant
```

Issuer (peer 1) is single-tenant; the API uses its configured wallet/admin context directly.

---

## 2. Tenants (holders & verifiers)

> Org2 (holders) and Org3 (verifiers) are multitenant. Org1 (issuer) is **not**.

### 2.1 Create a holder tenant (Org2)

```http
POST /agent/tenants/create
x-selected-peer: Holder
Content-Type: application/json
```

```json
{
  "wallet_name": "alice_wallet",
  "wallet_key": "alice_key",
  "label": "Alice (tenant)"
  // "newToken": true
}
```

Response :

```json
{
    "peer": "2",
    "created_at": "2025-11-19T08:18:29.768171Z",
    "updated_at": "2025-11-19T08:18:30.320157Z",
    "wallet_id": "12cd7c2f-7c3a-4a81-80b7-0433699bd866",
    "key_management_mode": "managed",
    "settings": {
        "wallet.type": "askar",
        "wallet.name": "alice_wallet",
        "wallet.webhook_urls": [],
        "wallet.dispatch_type": "base",
        "default_label": "Alice (tenant)",
        "wallet.id": "12cd7c2f-7c3a-4a81-80b7-0433699bd866"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ3YWxsZXRfaWQiOiIxMmNkN2MyZi03YzNhLTRhODEtODBiNy0wNDMzNjk5YmQ4NjYiLCJpYXQiOjE3NjM1NDAzMTB9.JvxNLY-tLHQx5h7Eb_gay7vaz3oSfJq1MMDwzlITLCU"
}
```

Notes:

- `newToken: true` (optional): force a new JWT (e.g. token compromise / rotation).

Repeat the same call with `x-selected-peer: Verifier` to create verifier tenants.

---

## 3. DID bootstrap (issuer + tenants)


```http
POST /agent/did/bootstrap
x-selected-peer: issuer         
// or holder / verifier depending who creates the invitation
Authorization: Bearer <tenant_jwt>   // for issuer and all tenants
Content-Type: application/json
```
Body:

```json
{
  // "new": true
}
```

Behavior:

- Without `new`: return existing keys (issuer reads the on-chain record; holder/verifier reuse latest wallet did:key).
- With `"new": true`: create new did:key for all roles; for issuer this rotates the BLS key on-chain while keeping `did:fabric:issuer` stable.

**Issuer anchoring is automated. Only the issuer DID is anchored on Fabric.**


---

## 4. Establish connections

We need:

- **Issuer ↔ Issuer** connection
- **Holder ↔ Verifier** connection

Holder ↔ Issuer now uses the public DID connect endpoint (holder side):

```http
POST /agent/connect-to-issuer
x-selected-peer: holder
Authorization: Bearer <holder_tenant_jwt>
Content-Type: application/json
```

All fields are optional; defaults are used if omitted:

```json
{
  // "issuer_alias": "issuer",
  // "their_public_did": "did:fabric:issuer",
  // "protocol": "didexchange/1.1",
  // "service_accept": ["didcomm/v2","didcomm/aip2;env=rfc19"],
  // "auto_accept": true
}
```

Use invitations below for **Holder ↔ Verifier**.

**Alias rule (active only):** The gateway rejects creating or accepting a connection if the alias already exists on an **active** connection. You’ll get `409 alias_taken` with the existing `connection_id`, so pick a different alias or delete the old connection.

### 4.1 Create invitation

On the side that **creates** the invitation:

```http
POST /agent/invitations/create
x-selected-peer: issuer         
// or holder / verifier depending who creates the invitation
Authorization: Bearer <tenant_jwt>   //
Content-Type: application/json
```

Body:

```json
{ "contact_alias": "John"}
```

Response includes an `invitation_url` and/or `invitation` object.

### 4.2 Accept invitation

On the **other** side (e.g. holder accepting issuer invitation):

```http
POST /agent/invitations/accept
x-selected-peer: holder
Authorization: Bearer <holder_tenant_jwt>
Content-Type: application/json
```

Option A – directly use `invitation_url`:

```json
{
  "invitation_url": "http://verifier:8050?oob=eyJAdHlwZSI6ICJodHRwczovL2RpZGNvbW0ub3JnL291dC1vZi1iYW5kLzIuMC9pbnZpdGF0aW9uIiwgIkBpZCI6IC...",
  "contact_alias": "DrX"
}
```

Option B – pass the full `invitation` object:

```json
{
  "invitation": {
    "@type": "https://didcomm.org/out-of-band/2.0/invitation",
    "@id": "9cb3361f-568c-4c12-8911-cb76f47dbbbb",
    "label": "Verifier Agent",
    "handshake_protocols": ["https://didcomm.org/didexchange/1.0"],
    "accept": ["didcomm/v2", "didcomm/aip2;env=rfc19"],
    "services": [
      {
        "id": "#inline",
        "type": "did-communication",
        "recipientKeys": [
          "did:key:z6MkkJw5zkCaNyo9asr1b7UcA7MEuEdyYAMRZAjuTiNTo41d#z6MkkJw5zkCaNyo9asr1b7UcA7MEuEdyYAMRZAjuTiNTo41d"
        ],
        "serviceEndpoint": "http://verifier:8050"
      }
    ]
  },
  "contact_alias": "DrX"
}
```

### 4.3 List connections

```http
GET /agent/connections
x-selected-peer: holder / verifier depending
Authorization: Bearer <tenant_jwt>
```

Use aliases (e.g. `"John"`, `"DrX"`, `"Consentis"`) in later calls.

### 4.4 Delete connections

```http
DELETE /agent/connections
x-selected-peer: holder / verifier depending
Authorization: Bearer <tenant_jwt>
```

Examples:

```http
DELETE /agent/connections?id=<uuid>
```

```http
DELETE /agent/connections?ontact_alias=DrX
```

```http
DELETE /agent/connections?ontact_alias=DrX&state=active
```

```http
DELETE /agent/connections # deletes all connections
```

---

## 5. Verifier requests consent (proof request)

From a **verifier tenant**:

```http
POST /agent/proofs/request
x-selected-peer: verifier
Authorization: Bearer <verifier_tenant_jwt>
Content-Type: application/json
```

Body:

```json
{
  "holder_alias": "John",
  "request_label": "DrX consent for claim 123"
}
```

Notes:
- `request_payload` is optional. If omitted, the proof request still asks for `credentialSubject.consentId`.
- By default the proof request also asks for `credentialSubject.requested_payload` so the verifier receives the full consent JSON.
- If `request_payload` is provided, the proof request also requires those keys via `consentedItems[*]`.
- `limit_disclosure` defaults to **`preferred`** so the holder can return the **full VC** (BbsBlsSignature2020).
  - If you force `limit_disclosure: "required"` you may hit JSON-LD/BBS derived-proof failures unless the VC top-level `@context` includes the needed vocabularies or the payload uses full IRIs.

This creates a DIF Presentation Exchange proof request. The API builds something like:

- `credentialSubject.consentedItems[*]` filters for each requested item (only if `request_payload` provided)
- `credentialSubject.consentId` field for anchoring
- `request_label` is stored as the request comment and PD name, so the holder can identify the request

Response:

```json
{
   "peer": "3",
    "connection_id": "023b5e44-072d-4e89-a064-00a01ecf9753",
    "requested": true,
    "request_label": "DrX consent for claim 123",
    "wantedItems": [],
    "result": {
        "state": "request-sent",..............
..........
    }
}
```

---

## 6. Holder inspects incoming requests

From a **holder tenant**:

```http
GET /agent/proofs/inbox
x-selected-peer: holder
Authorization: Bearer <holder_tenant_jwt>
```

Optional filters:

- by verifier alias:

  ```http
  GET /agent/proofs/inbox?verifier_alias=DrX
  ```

- by connection id:

  ```http
  GET /agent/proofs/inbox?connection_id=<uuid>
  ```

Use the `pres_ex_id` and/or verifier_alias/connection in the next step if you want to tie the consent VC to a specific request.

---

## 7. Holder creates the Consent VC

The holder now **issues a consent VC** that will later be presented as proof.

```http
POST /agent/credentials/propose
x-selected-peer: holder
Authorization: Bearer <holder_tenant_jwt>
Content-Type: application/json
```

Minimal example:

```json
{
  "issuer_alias": "Consentis",
  "requested_payload": {
    "consent": "grant",
    "scope": { "labs": true }
  },
  "durationDays": 1,
  "seed": "b64:AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA="
}
```

ConsentRecord example (JSON-LD terms embedded under `requested_payload`):

```json
{
  "issuer_alias": "Consentis",
  "requested_payload": {
    "@context": {
      "dpv": "https://w3id.org/dpv#",
      "dpv-pd": "https://w3id.org/dpv/pd#",
      "eu-gdpr": "https://w3id.org/dpv/legal/eu/gdpr#",
      "ex": "https://consentis-example.com/vocab#"
    },
    "ConsentRecord": {
      "Header": {
        "Identifier": "urn:uuid:...",
        "ConformsTo": "https://example.com/schemas/consent-record-v1.1.json",
        "DataSubject": "UUID-NHR-Karavias"
      }
      // ... ProcessingInfo, Parties, Events ...
    }
  },
  "durationDays": 1,
  "seed": "b64:AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA="
}
```

Supported fields:

```json
{
  "issuer_alias": "Consentis",

  // Consent scope
  "requested_payload": {
    "consent": "grant",
    "scope": { "labs": true },
    "notes": "ok"
  },
  "purposes": ["code001"],
  "operations": ["code001"],

  // Validity
  "durationDays": 1,

  // Holder binding: choose exactly one strategy
  "seed": "b64:AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=",
  // OR
  // "publicKeyPem": "-----BEGIN PUBLIC KEY-----...-----END PUBLIC KEY-----",

  // Consent id (anchor key)
  // "consentId": "c_customId"
}
```

Resolution rules:

- **`requested_payload`**  
  - **Required.** Must be a non-empty object.  
  - Stored as-is in the VC at `credentialSubject.requested_payload`.  
  - The **top-level keys** become `consentedItems` (used by verifiers when they request specific items).  
    If you include `@context` as a key, it will appear in `consentedItems`.

- **Key material**  
  - If `publicKeyPem` is present → `seed` is ignored; consent is bound to that public key.  
  - If only `seed` provided → API derives a deterministic EdDSA keypair.  
  - Only **EdDSA keys (Ed25519, Ed448)** are supported.

- **`consentId`**  
  - If **omitted** → API generates a unique `consentId` (e.g. `c_...`), anchors it on Fabric, returns it in the response.  
  - If **provided** → API checks if it already exists on chain; if yes, returns an error (enforces uniqueness).

---

## 7.1 Inspect holder credentials (W3C)

List all JSON-LD credentials in the holder wallet:

```http
GET /agent/credentials/w3c
x-selected-peer: holder
Authorization: Bearer <holder_tenant_jwt>
```

Get one credential by record id:

```http
GET /agent/credentials/w3c/<record_id>
x-selected-peer: holder
Authorization: Bearer <holder_tenant_jwt>
```

---

## 8. Holder sends proof (grant or deny)

The holder either **presents** the created VC, or **denies** the request.

```http
POST /agent/proofs/send
x-selected-peer: holder
Authorization: Bearer <holder_tenant_jwt>
Content-Type: application/json
```

Body options:

```json
{
  // "consentId": "c_931cc83bf4650994bb8c1b389224f8dc46ac82d4",
  // "pres_ex_id": "972fc3ca-e6d6-4bda-908d-8c7e736c5e7a",
  // "verifier_alias": "DrX",

  // Optional denial
  // "deny": true,
  // "reason": "Patient refused this access",
  // "remove": false  // when denying, delete the proof record after sending the problem-report
}
```

Resolution rules:

- If `deny: true` → the proof exchange is marked **abandoned** with
  `abandoned_reason = "abandoned: reason"`or if no reason provided `abandoned_reason = "abandoned: holder_denied_request"`.
  - If `remove: true` (only when denying) → best-effort delete of the proof record in ACA-Py.
- If not denying:
  - If `consentId` given → present that specific consent VC.
  - Else → use **latest** created consent VC for this holder.
  - Target proof request:
    1. If `pres_ex_id` given → that one.
    2. Else if `verifier_alias` given → latest request tied to that alias.
    3. Else → latest request overall.

---

## 9. Inspect proof records (for debugging / trace)

Both holders and verifiers can inspect their history.

```http
GET /agent/proofs/records
x-selected-peer: holder or verifier
Authorization: Bearer <tenant_jwt>
```

Filters:

- All:

  ```http
  GET /agent/proofs/records
  ```

- By state:

  ```http
  GET /agent/proofs/records?state=request-sent
  ```

  ```http
  GET /agent/proofs/records?state=request-received
  ```

  ```http
  GET /agent/proofs/records?state=done
  ```

- By contact_alias:

  ```http
  GET /agent/proofs/records?contact_alias=DrX
  ```

- By connection:

  ```http
  GET /agent/proofs/records?connection_id=<uuid>
  ```

- Combined:

  ```http
  GET /agent/proofs/records?contact_alias=DrX&state=done
  ```

Example verifier-side records for the same thread:

```json
[
  {
    "pres_ex_id": "e2ef3e65-1f44-4b3c-be43-69a00981504d",
    "contact_alias": "John",
    "state": "abandoned",
    "my_role": "verifier",
    "consentId": null,
    "abandoned_reason": "abandoned: holder_denied_request"
  },
  {
    "pres_ex_id": "1fdeb974-e7a7-4a81-86ed-b1f80730781a",
    "contact_alias": "John",
    "state": "done",
    "my_role": "verifier",
    "verified": true,
    "consentId": "c_296ad7bb98c1e3af0138f4f3489575629e551a0b",
    "abandoned_reason": null
  }
]
```

---

## 10. Verifier checks consent and leaves audit trail on-chain

The verifier can check that a given `consentId` is valid for a given purpose/operation.  
This wraps a lookup against the Fabric anchor and local state and leaves a trail in the blockchain.

```http
POST /agent/proofs/verify
x-selected-peer: verifier
Authorization: Bearer <verifier_tenant_jwt>
Content-Type: application/json
```

```json
{
  "consentId": "c_b69eeaba753e92d60e1ff495e58dc63bc8a1d545",
  "purpose": "code001",
  "operation": "code001"
}
```

Typical behavior:

- Check that `consentId` exists and is not revoked.
- Check that `purpose` and `operation` are allowed.
- Check that the consent is within its validity window (`durationDays`) not expired.

---

## 11. Holder revokes consent

The holder can revoke a consent using one of three signing modes:

```http
POST /agent/proofs/revoke
x-selected-peer: holder
Authorization: Bearer <holder_tenant_jwt>
Content-Type: application/json
```

### 11.1 Local signing via seed

```json
{
  "consentId": "c_7bebb5cb6a2ac1f9e30f1f8ecb7f9cfdeadbf491",
  "seed": "b64:AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA="
}
```

- API derives the EdDSA private key from the seed (same seed used in the propose step) and signs the revocation.
- Revocation is written on Fabric and reflected in future `verify` calls.

### 11.2 Externally signed (no seed/private key on server)

```json
{
  "consentId": "outsidesig",
  "publicKeyPem": "-----BEGIN PUBLIC KEY-----
MCowBQYDK2VwAyEAVaciqTAXm9w7PW8fHToUrFGMo+z406uX2NH6cuEDHkI=
-----END PUBLIC KEY-----
",
  "signature": "Ejr8L8wz0RLEpsegvXGeokbDR38rjqHZmI6xf+xWc2vj4f2yOczw+1mK+aUJ1LoTfl5CW7Z9Nt0V40L/ejEoDQ=="
}
```
*for signture see "Helper endpoint for external signatures" below*
- API verifies the signature against `publicKeyPem` and records the revocation.

### 11.3 Local signing via private key PEM

```json
{
  "consentId": "c_abc123...",
  "privateKeyPem": "-----BEGIN PRIVATE KEY-----
...
-----END PRIVATE KEY-----
"
}
```

- API loads the private key, signs the revocation and records it.

After revocation, `POST /agent/proofs/verify` for that `consentId` should indicate that the consent is no longer valid.
### 11.3 Local signing via private key PEM

```json
{
  "consentId": "c_abc123...",
  "privateKeyPem": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
}
```

- API loads the private key, signs the revocation and records it.

After revocation, `POST /agent/proofs/verify` for that `consentId` should indicate that the consent is no longer valid.

---

## 12. Helper endpoint for external signatures

When you use the **externally signed** mode of `/agent/proofs/revoke`, the signature must be computed over the same canonical data that the platform uses for the on-chain anchor:

- the **consent id** (`consentId` / `assetId`)
- the **VC creation timestamp** used when the consent anchor was created

If you sign completely outside the platform (e.g. hardware wallet, custom signer), you must ensure the signature is produced over this exact pair (asset id + creation timestamp). Otherwise the platform will reject the signature.

To make this easier to understand and test, the API exposes a helper endpoint that performs the signing given a private key PEM:

```http
POST /signVcAnchorAction
Content-Type: application/json
```

```json
{
  "assetId": "outsidesig",
  "timestamp": "2025-11-05T08:53:05.977Z",
  "privateKeyPem": "-----BEGIN PRIVATE KEY-----\nMC4CAQAwBQYDK2VwBCIEIMoQpCC1AfkeLVId0+dXDX7ouzZEUUxRLmGTDMYhRcfF\n-----END PRIVATE KEY-----\n"
}
```

- `assetId` must match the consent anchor id (the `consentId` you are using on-chain).
- `timestamp` must match the **original creation timestamp** of that consent VC / anchor.
- `privateKeyPem` is an EdDSA private key (Ed25519/Ed448).

The endpoint returns a `signature` value. That signature is exactly what you would need to pass as `signature` to the externally signed variant of `/agent/proofs/revoke` together with the matching `publicKeyPem`.

If you implement your own off-platform signer, reproduce the same message (assetId + timestamp) and signing scheme; as long as both `assetId` and `timestamp` match what was anchored, the platform will accept and verify the external signature.
