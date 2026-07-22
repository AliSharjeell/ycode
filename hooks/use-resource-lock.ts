'use client';

/**
 * Stub for the deleted Supabase resource lock hook. No-op.
 */
export function useResourceLock(_resourceType: string, _resourceId: string | null): {
  isLockedByOther: boolean;
  lockOwner: string | null;
} {
  return { isLockedByOther: false, lockOwner: null };
}
