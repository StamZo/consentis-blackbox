import express from "express";
import { upsertSnapshot } from "../services/proofRequestCache";
const router = express.Router();

// ACA-Py posts here:  .../webhooks/holder/topic/present_proof_v2_0
router.post("/webhooks/holder/topic/present_proof_v2_0", async (req, res) => {
  const state = req.body?.state;
  if (state !== "request-received") {
    return res.json({ cached: false, reason: "ignored_state", state });
  }

  const connection_id = req.body?.connection_id;
  const pres_ex_id    = req.body?.pres_ex_id;
  const thread_id     = req.body?.thread_id;

  const defs =
    req.body?.by_format?.pres_request?.dif?.presentation_definition?.input_descriptors ||
    req.body?.pres_request?.dif?.presentation_definition?.input_descriptors ||
    req.body?.presentation_request_dict?.dif?.presentation_definition?.input_descriptors ||
    [];

  const fields = (Array.isArray(defs) && defs[0]?.constraints?.fields) || [];
  const requiredItems: string[] = fields
    .filter((f: any) =>
      Array.isArray(f?.path) &&
      f.path.includes('$.credentialSubject.consentedItems[*]') &&
      f?.filter?.const != null
    )
    .map((f: any) => String(f.filter.const).trim().toLowerCase());

  upsertSnapshot({
    connection_id,
    requiredItems,
    updatedAt: new Date().toISOString(),
    pres_ex_id,
    thread_id,
  });

  return res.json({ cached: true, connection_id, requiredItems });
});

export default router;
