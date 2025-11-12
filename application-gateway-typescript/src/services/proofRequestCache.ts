// services/proofRequestCache.ts
export type Snapshot = {
  connection_id: string;
  requiredItems: string[];
  updatedAt: string;          // ISO
  pres_ex_id?: string;
  thread_id?: string;
};

const byConnection = new Map<string, Snapshot>();
let lastGlobal: Snapshot | null = null;

export function upsertSnapshot(s: Snapshot) {
  byConnection.set(s.connection_id, s);
  if (!lastGlobal || new Date(s.updatedAt) > new Date(lastGlobal.updatedAt)) {
    lastGlobal = s;
  }
}

export function getLatestByConnection(connection_id: string): Snapshot | null {
  return byConnection.get(connection_id) ?? null;
}

export function getLatestGlobal(): Snapshot | null {
  return lastGlobal;
}
