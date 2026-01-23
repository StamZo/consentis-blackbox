import { Request } from 'express'
import { clientForReq } from '../acapy'
import { resolvePeer } from './peers'

export function ctx(req: Request) {
  const raw =
    (req as any).userPayload?.selected_peer ??
    req.get?.('x-selected-peer') ??
    (req.headers as any)['x-selected-peer'] ??
    (req.query as any)?.selected_peer ??
    (req.body as any)?.selected_peer

  const peer = resolvePeer(raw)
  if (!peer) {
    const e: any = new Error(
      'selected_peer missing or invalid (accepts 1/2/3 or issuer/holder/verifier)'
    )
    e.status = 400
    throw e
  }

  // tenant-aware ACA-Py client (base URL + tenant bearer token etc.)
  const c = clientForReq(req, peer)

  // forward caller auth when calling *your own* API endpoints internally
  const authHdr = {
    authorization: String(req.headers.authorization || ''),
  }

  // build our own base URL; prefer forwarded headers if behind a proxy
  const xfProto = String((req.headers as any)['x-forwarded-proto'] || '')
  const xfHost = String((req.headers as any)['x-forwarded-host'] || '')
  const proto = xfProto ? xfProto.split(',')[0].trim() : req.protocol
  const host = xfHost ? xfHost.split(',')[0].trim() : String(req.get('host') || '')
  const selfBase = `${proto}://${host}`

  return { peer, c, authHdr, selfBase }
}
