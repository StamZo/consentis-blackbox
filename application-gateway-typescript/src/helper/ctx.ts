import { Request } from 'express';
import { clientForReq } from '../acapy';
import { resolvePeer } from './peers';

export function ctx(req: Request) {
  const raw =
    (req as any).userPayload?.selected_peer ??
    req.get?.('x-selected-peer') ?? (req.headers as any)['x-selected-peer'] ??
    (req.query as any)?.selected_peer ??
    (req.body  as any)?.selected_peer;

  const peer = resolvePeer(raw);
  if (!peer) {
    const e: any = new Error('selected_peer missing or invalid (accepts 1/2/3 or issuer/holder/verifier)');
    e.status = 400; throw e;
  }

  const c = clientForReq(req, peer);            // ACA-Py client
  const authHdr = { authorization: String((req.headers as any).authorization || '') };
  const selfBase = `${(req as any).protocol}://${(req as any).get('host')}`;

  return { peer, c, authHdr, selfBase };
}
