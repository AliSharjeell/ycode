/**
 * Shim for `@vercel/functions`.
 *
 * The desktop app does not run on Vercel, so cache-tag invalidation is a
 * no-op. We keep the import surface so the renderer code compiles.
 */
export async function addCacheTag(_tags: string[]): Promise<void> {
  // no-op in the static-export / desktop-build world
}

export function unstable_cacheTag(_tags: string[]): void {
  // no-op
}
