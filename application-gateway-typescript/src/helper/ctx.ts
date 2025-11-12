// src/helpers/ctx.ts
import { Request } from 'express';
import { clientForReq } from '../acapy';

export function ctx(req: Request) {
  const peer =
    (req as any).userPayload?.selected_peer ||
    req.get?.('x-selected-peer') || (req.headers as any)['x-selected-peer'] ||
    (req.query as any)?.selected_peer ||
    (req.body  as any)?.selected_peer;

  if (!peer || !/^(1|2|3)$/.test(String(peer))) {
    const e: any = new Error('selected_peer missing or invalid (expected 1/2/3)');
    e.status = 400; throw e;
  }

  const peerId = String(peer).trim();
  const c = clientForReq(req, peerId); // ACA-Py client that forwards caller’s Authorization
  const authHdr = { authorization: String(req.headers.authorization || '') };
  const selfBase = `${req.protocol}://${req.get('host')}`;

  return { peer: peerId, c, authHdr, selfBase };
}
