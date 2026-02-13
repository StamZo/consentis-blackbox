# Smart Contract Generator + Finder (BlackBox Complement)

This document complements `BlackBoxReadMe.md` and focuses specifically on the **Smart Contract Generator + Finder** path implemented in the application gateway. It describes what is created, where it is stored, and how to query it.

## Scope

This covers the following capabilities:
- **Generator**: Build a machine-readable contract descriptor from a consent policy and dataset categories.
- **Finder**: Search contract descriptors by dataset, purpose, operation, etc.
- **Audit (off-chain)**: Record access decisions with requester org + purpose/operation (without putting personal data on-chain).

It does **not** change the existing chaincode logic; it extends the off-chain layer only.

---

## Data Model (Off-Chain)

All data is stored in the same CouchDB database (configured by `COUCHDB_DB`).

### Contract Descriptor Document

Stored with:
- `docType: "contractDescriptor"`
- `descriptorHash` (SHA-256 of canonicalized descriptor JSON)
- `descriptorJson` (machine-readable descriptor)
- `policyHash`, `templateHash`, `templateVersion`
- `datasetIds` (controlled vocabulary)
- `purposes`, `operations`
- `durationSecs`, `assuranceLevel`
- `issuerOrgId`

### Audit Event Document

Stored with:
- `docType: "auditEvent"`
- `consentId`
- `requesterOrg`
- `purposes`, `operations`
- `result`, `reason`

---

## Dataset IDs (Controlled Vocabulary)

Only the following values are accepted in `datasetIds`:

**Use Case 1 — Primary use (Healthcare)**
- `health:phr`
- `health:lab_results`
- `health:diagnoses`
- `health:prescriptions`
- `health:clinical_notes`
- `health:imaging`

**Use Case 2 — Secondary use (Healthcare + Insurance)**
- `health:summary`
- `health:chronic_conditions`
- `health:risk_factors`
- `health:recent_treatments`
- `finance:insurance_underwriting_inputs`

**Use Case 3 — Secondary use at scale (Registry → insurer)**
- `health:population_cohorts`
- `health:aggregated_statistics`
- `health:registry_extracts`
- `finance:actuarial_analysis_inputs`

If you need additional categories, extend:
`src/helper/datasetIds.ts`

---

## Core Flow

### 1) Propose Credential (Holder)
The holder sends a credential proposal including `datasetIds`:

```json
POST /agent/credentials/propose
{
  "issuer_alias": "issuer",
  "requested_payload": {"test": "newtest123"},
  "purposes": ["pcode001"],
  "operations": ["ocode001"],
  "datasetIds": ["health:phr", "health:chronic_conditions"],
  "durationDays": 1,
  "seed": "b64:AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=",
  "consentId": "newtest"
}
```

The VC proposal carries `datasetIds` in the credential subject. The response also includes a **policyHash preview** (deterministic, no DB write).

### 2) Issuance → Anchoring → Descriptor Creation
When the issuer **issues** the credential, the issuer webhook triggers `/anchors/create` and **automatically creates a contract descriptor** (only if `datasetIds` are present).

---

## APIs

### What is a “descriptor”?
**Descriptor = machine‑readable summary of the consent contract.**  
It is **not** the VC itself and **not** the on‑chain anchor. It is a compact, indexed object that says:
- *what data category* (`datasetIds`)
- *for what purpose* (`purposes`)
- *under what operations* (`operations`)
- *for how long* (`durationSecs`)
- *which policy* (`policyHash`, `templateHash`, `templateVersion`)

**Use:** it enables **Finder** queries (e.g., “find all contracts that allow operation X on dataset Y”) and supports audits/interoperability **without exposing personal data**. It links back to the on‑chain consent via `policyHash`.

### Create / Upsert Contract Descriptor
Creates (or reuses) the **contract descriptor** for a policy + dataset categories. Use this when you want a descriptor even if you are not going through the issuance flow.
```json
POST /upsertContractDescriptor
{
  "policyHash": "<policyHash>",
  "datasetIds": ["health:phr"],
  "issuerOrgId": "Org1"
}
```
Success: returns `descriptorHash` and `descriptorJson` (existing or newly created).

### Get Contract Descriptor
Fetch a previously stored descriptor by its hash.
```
GET /getContractDescriptor/:hash
```

### Find Contracts (Finder)
Search contract descriptors by dataset/purpose/operation (and optional org/template filters). This is the **Finder** interface.
```json
POST /findContracts
{
  "datasetId": "health:phr",
  "purpose": "pcode001",
  "operation": "ocode001",
  "issuerOrgId": "Org1",
  "templateVersion": "v3",
  "limit": 50
}
```

### Audit Access (off-chain)
List off-chain access audit events (who/purpose/operation + decision).
```
GET /audit/access/:consentId
```

---

## Linkage Model (On-chain ↔ Off-chain)

- **On-chain** (`readVcAnchor`) returns `policyHash` and `consentId`.
- **Off-chain** contract descriptors are indexed by `policyHash`.

So the recommended linkage is:

1. `readVcAnchor/<consentId>` → get `policyHash`
2. `findContracts` or `getContractDescriptor` → match by `policyHash`

---

## Notes

- `descriptorHash` is created **after issuance**, not at proposal time.
- `findContracts` always queries documents with `docType: "contractDescriptor"` (no explicit filter needed).
- Off-chain audit is used to store **who/purpose** without adding personal data to the blockchain.
