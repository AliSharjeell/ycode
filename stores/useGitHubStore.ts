/**
 * useGitHubStore — connection state, device flow, and repo list.
 */
import { create } from 'zustand';
import { githubApi } from '@/lib/api';

interface DeviceFlow {
  userCode: string;
  verificationUri: string;
  deviceCode: string;
  interval: number;
}

interface GitHubState {
  connected: boolean;
  login: string | null;
  deviceFlow: DeviceFlow | null;
  repos: { name: string; fullName: string; private: boolean; htmlUrl: string }[];
  loading: boolean;
  error: string | null;

  refresh: () => Promise<void>;
  startDeviceFlow: () => Promise<{ ok: boolean; error?: string }>;
  pollDeviceFlow: () => Promise<{ ok: boolean; error?: string }>;
  cancelDeviceFlow: () => void;
  disconnect: () => Promise<void>;
  listRepos: () => Promise<void>;
  createRepo: (name: string, opts: { isPrivate: boolean; description?: string }) =>
    Promise<{ ok: boolean; htmlUrl?: string; cloneUrl?: string; error?: string }>;
}

export const useGitHubStore = create<GitHubState>((set, get) => ({
  connected: false,
  login: null,
  deviceFlow: null,
  repos: [],
  loading: false,
  error: null,

  refresh: async () => {
    set({ loading: true, error: null });
    try {
      const status = await githubApi.status();
      set({
        connected: status.connected,
        login: status.login ?? null,
        loading: false,
      });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : String(err), loading: false });
    }
  },

  startDeviceFlow: async () => {
    try {
      const flow = await githubApi.startDeviceFlow();
      if ('ok' in flow && flow.ok === false) {
        return { ok: false, error: flow.error };
      }
      set({
        deviceFlow: {
          userCode: flow.userCode,
          verificationUri: flow.verificationUri,
          deviceCode: flow.deviceCode,
          interval: flow.interval,
        },
      });
      return { ok: true };
    } catch (err) {
      return { ok: false, error: err instanceof Error ? err.message : String(err) };
    }
  },

  pollDeviceFlow: async () => {
    const flow = get().deviceFlow;
    if (!flow) return { ok: false, error: 'No device flow in progress' };
    const result = await githubApi.pollDeviceFlow(flow.deviceCode, flow.interval);
    if (result.ok) {
      set({ deviceFlow: null, connected: true, login: result.login });
      return { ok: true };
    }
    if (result.pending) {
      return { ok: false, error: 'pending' };
    }
    set({ deviceFlow: null, error: result.error });
    return { ok: false, error: result.error };
  },

  cancelDeviceFlow: () => set({ deviceFlow: null }),

  disconnect: async () => {
    await githubApi.disconnect();
    set({ connected: false, login: null, repos: [] });
  },

  listRepos: async () => {
    const repos = await githubApi.listRepos();
    set({ repos });
  },

  createRepo: async (name, opts) => {
    const result = await githubApi.createRepo(name, opts);
    return result;
  },
}));
