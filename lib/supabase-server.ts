/**
 * @deprecated Stub for the deleted Supabase server client.
 *
 * The desktop app does not run on Supabase. This stub keeps the
 * import surface so legacy code compiles. All operations are no-ops.
 */
/* eslint-disable @typescript-eslint/no-explicit-any */

export function getSupabaseServerClient(): any {
  return null;
}

export async function getStorageBucket(): Promise<string> {
  return 'ycode';
}

export async function testConnection(): Promise<boolean> {
  return false;
}

export async function sqlRpc(_fn: string, _args: any): Promise<any> {
  return null;
}

export function getSupabaseAdmin(): any {
  return null;
}

export const tenantStore = {
  getTenantId: (_headers: any): string | null => null,
  setTenantId: (_h: any, _id: string | null): void => {},
};


// Add getStore method to the existing tenantStore.
if (typeof (tenantStore as any).getStore !== 'function') {
  (tenantStore as any).getStore = (): string | null => null;
}
