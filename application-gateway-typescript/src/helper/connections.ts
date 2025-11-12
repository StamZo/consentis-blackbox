// src/helpers/connections.ts
export async function connectionIdFromAlias(c: any, alias: string): Promise<string> {
  const { data } = await c.get('/connections', { params: { alias, state: 'active' } });
  const list = data?.results || [];
  if (!list.length) {
    const e: any = new Error(`No active connection with alias "${alias}"`);
    e.status = 404; throw e;
  }
  list.sort((a: any, b: any) =>
    new Date(b.updated_at || b.created_at || 0).getTime() -
    new Date(a.updated_at || a.created_at || 0).getTime()
  );
  return list[0].connection_id as string;
}
