/**
 * Stub for the deleted Supabase collaboration presence store. No-op.
 */
import { create } from 'zustand';

interface CollaborationUser {
  id: string;
  name: string;
  color: string;
  [key: string]: unknown;
}

interface CollaborationState {
  currentUserId: string | null;
  users: CollaborationUser[];
  resourceLocks: Record<string, string>;
  notifications: any[];
  isConnected: boolean;
}

export const useCollaborationPresenceStore = create<CollaborationState>(() => ({
  currentUserId: null,
  users: [],
  resourceLocks: {},
  notifications: [],
  isConnected: false,
}));

export const RESOURCE_TYPES = {
  LAYER: 'layer',
  COLLECTION_ITEM: 'collection_item',
} as const;

export function getResourceLockKey(type: string, id: string): string {
  return `${type}:${id}`;
}
