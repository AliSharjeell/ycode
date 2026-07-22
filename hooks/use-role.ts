'use client';

/**
 * Stub for the deleted role hook. Always returns owner.
 */
export function useRole(): {
  role: 'owner';
  isOwner: boolean;
  isEditor: boolean;
  canEditStructure: boolean;
  canManageSettings: boolean;
} {
  return {
    role: 'owner',
    isOwner: true,
    isEditor: false,
    canEditStructure: true,
    canManageSettings: true,
  };
}
