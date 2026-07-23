/**
 * Stub for the deleted AI agent settings store. No-op.
 */
import { create } from 'zustand';

interface AgentSettingsState {
  enabled: boolean;
  provider: string | null;
  hasKey: boolean;
  loadStatus: () => Promise<void>;
}

export const useAgentSettingsStore = create<AgentSettingsState>((set) => ({
  enabled: false,
  provider: null,
  hasKey: false,
  loadStatus: async () => set({ enabled: false, provider: null, hasKey: false }),
}));
