// routes/issuer-webhooks.ts
import axios from "axios";
import express from "express";
const router = express.Router();

function pickConsentInputs(rec: any) {
  const issued   = rec?.by_format?.cred_issue?.ld_proof;
  const offer    = rec?.by_format?.cred_offer?.ld_proof;
  const request  = rec?.by_format?.cred_request?.ld_proof;
  const proposed = rec?.by_format?.cred_proposal?.ld_proof;

  const src = issued ?? offer ?? request ?? proposed ?? null;
  if (!src) return {};

  const vc = src.credentialSubject ? src
           : src.credential?.credentialSubject ? src.credential
           : null;

  const cs = vc?.credentialSubject ?? {};
  const consentId    = cs.consentId;
  const publicKeyPem = cs.publicKeyPem;
  const purposes     = cs.purposes;
  const operations   = cs.operations;
  const durationDays = cs.durationDays;
  const datasetIds   = cs.datasetIds;

  return { consentId, publicKeyPem, purposes, operations, durationDays, datasetIds };
}

// ACA-Py appends /topic/<topic> to --webhook-url
router.post('/webhooks/issuer/topic/issue_credential_v2_0', async (req, res) => {
  const state = req.body?.state;
  console.log('ISSUER WEBHOOK HIT:', state);

  // CHANGE #1: act only on the single final state that carries the VC; ignore 'done'
  if (state !== 'credential-issued') {
    return res.json({ anchored: false, reason: 'state_not_final', state });
  }

  const inputs = pickConsentInputs(req.body);
  console.log('ANCHOR INPUTS:', inputs);

  const { consentId, publicKeyPem, purposes, operations, durationDays, datasetIds } = inputs || {};
  if (!consentId || !publicKeyPem) {
    console.warn('MISSING FIELDS for anchoring', { consentId: !!consentId, publicKeyPem: !!publicKeyPem });
    return res.json({ anchored: false, reason: 'missing_consent_fields' });
  }

  const headers = { 'x-selected-peer': '1' };

  try {
    await axios.get(`http://localhost:8000/readVcAnchor/${encodeURIComponent(consentId)}`, { headers });
    console.log('ALREADY ANCHORED:', consentId);
    return res.json({ anchored: false, reason: 'already_anchored', consentId });
  } catch (e: any) {
    // CHANGE #2: proceed if "not found" is reported either as 404 OR as 500 with "does not exist"
    const status = e?.response?.status;
    const data = e?.response?.data;
    const msg = typeof data === 'string' ? data : data?.error || data?.message || '';
    const notFound =
      status === 404 ||
      (status === 500 && String(msg).toLowerCase().includes('does not exist'));

    if (!notFound) {
      console.error('LEDGER READ FAIL:', status, data);
      return res.status(502).json({ anchored: false, reason: 'ledger_read_failed', detail: data });
    }
  }

  const payload = {
    consentId, publicKeyPem,
    ...(Array.isArray(purposes)   && purposes.length   ? { purposes }   : {}),
    ...(Array.isArray(operations) && operations.length ? { operations } : {}),
    ...(Number.isFinite(+durationDays) && +durationDays > 0 ? { durationDays: +durationDays } : {}),
    ...(Array.isArray(datasetIds) && datasetIds.length ? { datasetIds } : {})
  };

  try {
    const { data } = await axios.post('http://localhost:8000/anchors/create', payload, { headers });
    console.log('ANCHOR CREATED:', consentId, data);
    return res.json({ anchored: true, consentId, result: data });
  } catch (e: any) {
    console.error('ANCHOR CREATE FAIL:', e?.response?.status, e?.response?.data || e?.message);
    return res.status(502).json({ anchored: false, reason: 'ledger_write_failed', detail: e?.response?.data || e?.message });
  }
});

export default router;
