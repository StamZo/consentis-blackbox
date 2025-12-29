// src/helper/peers.ts
export type PeerNum = '1' | '2' | '3';

const ALIASES: Record<string, PeerNum> = {
  '1': '1', 'org1': '1', 'org1msp': '1', 'issuer': '1',
  '2': '2', 'org2': '2', 'org2msp': '2', 'holder': '2',
  '3': '3', 'org3': '3', 'org3msp': '3', 'verifier': '3',
};

export function resolvePeer(input: unknown): PeerNum | null {
  if (input == null) return null;
  const key = String(input).trim().toLowerCase();
  return (ALIASES as any)[key] ?? null;
}
