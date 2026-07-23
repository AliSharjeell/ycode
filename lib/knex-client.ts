/**
 * @deprecated Stub for the deleted Knex client.
 *
 * The desktop app uses file-system repositories in lib/projects/
 * instead of Postgres. The old knex-client is a no-op so legacy
 * imports compile.
 */
export function getKnex(): any {
  return null;
}

export async function closeKnex(): Promise<void> {
  // no-op
}
