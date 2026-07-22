/**
 * useGitStore — git status, log, branch, and commit dialog state.
 */
import { create } from 'zustand';
import { gitApi } from '@/lib/api';

export interface GitStatusEntry {
  file: string;
  type: 'added' | 'modified' | 'deleted' | 'untracked' | 'ignored';
}

export interface GitLogEntry {
  oid: string;
  message: string;
  author: { name: string; email: string; timestamp: number };
  committer: { name: string; email: string; timestamp: number };
}

interface GitState {
  status: GitStatusEntry[];
  log: GitLogEntry[];
  currentBranch: string;
  branches: string[];
  remotes: { name: string; url: string }[];
  loading: boolean;
  error: string | null;

  refresh: () => Promise<void>;
  commit: (message: string) => Promise<{ ok: boolean; error?: string }>;
  push: () => Promise<{ ok: boolean; error?: string }>;
  pull: () => Promise<{ ok: boolean; error?: string }>;
  fetch: () => Promise<{ ok: boolean; error?: string }>;
  checkout: (branch: string) => Promise<{ ok: boolean; error?: string }>;
  createBranch: (branch: string) => Promise<{ ok: boolean; error?: string }>;
  addRemote: (name: string, url: string) => Promise<{ ok: boolean; error?: string }>;
  init: () => Promise<{ ok: boolean; error?: string }>;
  diff: (path: string) => Promise<string>;
}

export const useGitStore = create<GitState>((set, get) => ({
  status: [],
  log: [],
  currentBranch: 'main',
  branches: [],
  remotes: [],
  loading: false,
  error: null,

  refresh: async () => {
    set({ loading: true, error: null });
    try {
      const [status, log, branch, remotes] = await Promise.all([
        gitApi.status() as Promise<GitStatusEntry[]>,
        gitApi.log(50) as Promise<GitLogEntry[]>,
        gitApi.branch(),
        gitApi.remote(),
      ]);
      set({
        status: status ?? [],
        log: log ?? [],
        currentBranch: branch.current,
        branches: branch.all,
        remotes: remotes ?? [],
        loading: false,
      });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : String(err), loading: false });
    }
  },

  commit: async (message: string) => {
    const result = await gitApi.commit(message);
    if (result.ok) {
      await get().refresh();
    }
    return result;
  },

  push: async () => {
    const result = await gitApi.push();
    if (result.ok) {
      await get().refresh();
    }
    return result;
  },

  pull: async () => {
    const result = await gitApi.pull();
    if (result.ok) {
      await get().refresh();
    }
    return result;
  },

  fetch: async () => {
    const result = await gitApi.fetch();
    if (result.ok) {
      await get().refresh();
    }
    return result;
  },

  checkout: async (branch: string) => {
    const result = await gitApi.checkout(branch);
    if (result.ok) {
      await get().refresh();
    }
    return result;
  },

  createBranch: async (branch: string) => {
    const result = await gitApi.createBranch(branch);
    if (result.ok) {
      await get().refresh();
    }
    return result;
  },

  addRemote: async (name: string, url: string) => {
    const result = await gitApi.addRemote(name, url);
    if (result.ok) {
      await get().refresh();
    }
    return result;
  },

  init: async () => {
    const result = await gitApi.init(true);
    if (result.ok) {
      await get().refresh();
    }
    return result;
  },

  diff: async (path: string) => gitApi.diff(path),
}));
