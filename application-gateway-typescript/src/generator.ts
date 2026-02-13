// src/generator.ts

import * as path from 'path';
import * as fs from 'fs';
import * as crypto from 'crypto';
import Ajv from 'ajv';
import canonicalize from 'canonicalize';

const SEP = '\u001F';
const norm = (s: string) => String(s).trim().toLowerCase();
const sha256 = (s: string) => crypto.createHash('sha256').update(s).digest('hex');
const atom = (k: string, v: string) => sha256(k + SEP + v);

// Recursively project ONLY schema-defined keys from src
function projectBySchema(schema: any, src: any): any {
  if (!schema || typeof src !== 'object' || src === null) return src;
  if (schema.type === 'object' && schema.properties) {
    const out: any = {};
    for (const [k, sub] of Object.entries(schema.properties)) {
      if (src[k] === undefined) continue;
      out[k] = projectBySchema(sub, src[k]);
    }
    return out;
  }
  if (schema.type === 'array' && Array.isArray(src)) {
    const itemSchema = (schema as any).items ?? {};
    return src.map((el: any) => projectBySchema(itemSchema, el));
  }
  return src; // primitives
}

// Normalize common fields if present
function normalizePolicy(policy: any) {
  if (Array.isArray(policy.purposes)) {
    policy.purposes = Array.from(new Set(policy.purposes.map(norm))).filter(Boolean);
  }
  if (Array.isArray(policy.operations)) {
    policy.operations = Array.from(new Set(policy.operations.map(norm))).filter(Boolean);
  }
  // If schema expects durationSecs but user provided durationDays
  if (policy.durationSecs === undefined && typeof policy.durationDays === 'number') {
    policy.durationSecs = Math.round(policy.durationDays * 86400);
    delete policy.durationDays;
  }
  return policy;
}

// Build atom set from the finalized policy
export function buildConstraintsSet(policy: any): string[] {
  const atoms: string[] = [];
  // per-item atoms for purpose/operation
  for (const p of policy.purposes ?? []) atoms.push(atom('purpose', p));
  for (const o of policy.operations ?? []) atoms.push(atom('operation', o));

  // flatten everything else except templateHash
  const { templateHash, purposes, operations, ...rest } = policy ?? {};
  const walk = (prefix: string, val: any) => {
    if (val === null || val === undefined) return;
    if (Array.isArray(val)) {
      for (const el of val) {
        const v = typeof el === 'string' ? norm(el) : JSON.stringify(el);
        atoms.push(atom(prefix, v));
      }
      return;
    }
    if (typeof val === 'object') {
      for (const [k, v2] of Object.entries(val)) walk(prefix ? `${prefix}.${k}` : k, v2);
      return;
    }
    const v = typeof val === 'string' ? norm(val) : JSON.stringify(val);
    if (prefix !== 'purposes' && prefix !== 'operations') atoms.push(atom(prefix, v));
  };
  walk('', rest);

  return Array.from(new Set(atoms)).sort();
}

export function generateConsentPolicy(body: any) {
  const version = body.version ?? '3';

  // 1) Load template schema
  const primaryPath = path.resolve(__dirname, 'templates', `v${version}.json`);
  const fallbackPath = path.resolve(__dirname, '../src/templates', `v${version}.json`);
  const templatePath = fs.existsSync(primaryPath) ? primaryPath : fallbackPath;
  if (!fs.existsSync(templatePath)) {
    throw new Error(`Template file not found for version v${version} (${templatePath})`);
  }
  const templateSchema = JSON.parse(fs.readFileSync(templatePath, 'utf8'));

  // 2) Compute templateHash
  const canonicalTemplate = canonicalize(templateSchema);
  if (canonicalTemplate === undefined) {
    throw new Error(`Failed to canonicalize template schema for version v${version}`);
  }
  const templateHash = sha256(canonicalTemplate);

  // 3) Prepare src allowing durationDays→durationSecs convenience
  const src: any = { ...body };
  if (src.durationSecs === undefined && src.durationDays !== undefined) {
    const d = Number(src.durationDays);
    if (!Number.isNaN(d) && d > 0) src.durationSecs = Math.round(d * 86400);
  }
  // Allow comma-separated purposes/operations OR arrays
  if (typeof src.purposes === 'string') src.purposes = src.purposes.split(',').map(norm).filter(Boolean);
  if (typeof src.operations === 'string') src.operations = src.operations.split(',').map(norm).filter(Boolean);

  // 4) Project by schema & normalize
  let policyJson: any = projectBySchema(templateSchema, src);
  policyJson = normalizePolicy(policyJson);
  policyJson.templateHash = templateHash;

  // 5) Validate with Ajv
  const ajv = new Ajv({ allErrors: true });
  const validate = ajv.compile(templateSchema);
  if (!validate(policyJson)) {
    const msg = ajv.errorsText(validate.errors, { separator: '\n' });
    throw new Error(`Policy does not match template v${version}:\n${msg}`);
  }

  // 6) Hash policy
  const canonicalPolicy = canonicalize(policyJson);
  if (canonicalPolicy === undefined) {
    throw new Error('Failed to canonicalize policy');
  }
  const policyHash = sha256(canonicalPolicy);

  // 7) Build atoms for Fabric (issuer will pass these when creating the anchor)
  const constraintsSet = buildConstraintsSet(policyJson);

  return {
    policyJson,
    policyHash,
    templateHash,
    templateVersion: `v${version}`,
    durationSecs: typeof policyJson.durationSecs === 'number' ? policyJson.durationSecs : undefined,
    assuranceLevel: policyJson.assuranceLevel ?? null,
    constraintsSet
  };
}

const MAX_DURATION_SECS = Number(process.env.CONSENT_MAX_DURATION_SECS ?? 3 * 365 * 24 * 60 * 60);

export function validatePolicyForDeployment(policyJson: any) {
  if (!policyJson || typeof policyJson !== 'object') {
    throw new Error('Policy is missing or invalid');
  }
  const purposes = Array.isArray(policyJson.purposes) ? policyJson.purposes : [];
  const operations = Array.isArray(policyJson.operations) ? policyJson.operations : [];
  if (purposes.length === 0) throw new Error('Policy must include at least one purpose');
  if (operations.length === 0) throw new Error('Policy must include at least one operation');

  const durationSecs = Number(policyJson.durationSecs);
  if (!Number.isFinite(durationSecs) || durationSecs <= 0) {
    throw new Error('Policy durationSecs is missing or invalid');
  }
  if (durationSecs > MAX_DURATION_SECS) {
    throw new Error(`Policy durationSecs exceeds max of ${MAX_DURATION_SECS}`);
  }

  if (policyJson.legalFlags && policyJson.legalFlags.freelyGiven === false) {
    throw new Error('Policy legalFlags.freelyGiven must not be false');
  }
  return true;
}

export function generateContractDescriptor(input: {
  policyJson: any;
  policyHash: string;
  templateHash?: string;
  templateVersion?: string;
  datasetIds: string[];
  issuerOrgId?: string | null;
  context?: any;
  descriptorVersion?: string;
}) {
  const normArray = (arr: any[]) =>
    Array.from(new Set((arr || []).map(x => String(x).trim()).filter(Boolean)));

  const datasetIds = normArray(input.datasetIds);
  if (datasetIds.length === 0) {
    throw new Error('datasetIds are required for a contract descriptor');
  }

  const purposes = normArray(input.policyJson?.purposes || []);
  const operations = normArray(input.policyJson?.operations || []);

  const descriptor: any = {
    '@context': input.context || undefined,
    type: 'ConsentContractDescriptor',
    descriptorVersion: input.descriptorVersion || 'v1',
    policyHash: input.policyHash,
    templateHash: input.templateHash,
    templateVersion: input.templateVersion,
    datasetIds,
    purposes,
    operations,
    durationSecs: input.policyJson?.durationSecs,
    assuranceLevel: input.policyJson?.assuranceLevel ?? null,
    legalFlags: input.policyJson?.legalFlags ?? undefined,
    issuerOrgId: input.issuerOrgId ?? null,
    createdAt: new Date().toISOString()
  };

  // strip undefined so hash is stable
  const cleaned = JSON.parse(JSON.stringify(descriptor));
  const canonical = canonicalize(cleaned);
  if (canonical === undefined) {
    throw new Error('Failed to canonicalize contract descriptor');
  }
  const descriptorHash = sha256(canonical);
  return { descriptorJson: cleaned, descriptorHash };
}
