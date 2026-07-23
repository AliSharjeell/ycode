'use client';

/**
 * Stub for the deleted layer locks hook. No-op.
 */
export function useLayerLocks(_pageId: string): {
  isLayerLockedByOther: (layerId: string) => boolean;
  lockOwner: (layerId: string) => string | null;
} {
  return {
    isLayerLockedByOther: () => false,
    lockOwner: () => null,
  };
}
