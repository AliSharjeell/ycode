/**
 * @deprecated Stub for the deleted Supabase auth store.
 *
 * The desktop app has no Supabase auth. The original YCodeBuilderMain
 * imports `useAuthStore`; this stub preserves the API surface so the
 * component loads. All operations are no-ops.
 */
import { create } from 'zustand';

interface AuthState {
  user: { id: string; email: string } | null;
  session: unknown | null;
  isLoading: boolean;
  initialize: () => Promise<void>;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<void>;
  getSession: () => unknown | null;
  getUser: () => { id: string; email: string } | null;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: { id: 'local', email: 'local@ycode' },
  session: null,
  isLoading: false,
  initialize: async () => {},
  signIn: async () => {},
  signOut: async () => {},
  refreshSession: async () => {},
  getSession: () => get().session,
  getUser: () => get().user,
}));
