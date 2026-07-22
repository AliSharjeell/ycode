/**
 * useProjectStore — the renderer's view of the currently open project.
 *
 * Holds the project path, dirty state, and recent projects list. The
 * actual file-IO operations live in the main process; this store proxies
 * to them via the IPC bridge.
 */
import { create } from 'zustand';
import { projectApi, isDesktop } from '@/lib/api';

interface ProjectMeta {
  id: string;
  name: string;
  createdAt: string;
  lastOpenedAt: string;
}

interface ProjectState {
  path: string | null;
  meta: ProjectMeta | null;
  isDirty: boolean;
  recent: string[];
  loading: boolean;
  error: string | null;

  refresh: () => Promise<void>;
  open: () => Promise<void>;
  openPath: (path: string) => Promise<void>;
  create: () => Promise<void>;
  close: () => Promise<void>;
  loadRecent: () => Promise<void>;
  setDirty: (dirty: boolean) => void;
}

export const useProjectStore = create<ProjectState>((set) => ({
  path: null,
  meta: null,
  isDirty: false,
  recent: [],
  loading: false,
  error: null,

  refresh: async () => {
    if (!isDesktop()) {
      set({ path: null, meta: null, recent: [] });
      return;
    }
    set({ loading: true, error: null });
    try {
      const current = await projectApi.current();
      const recent = await projectApi.listRecent();
      set({
        path: current.path,
        meta: (current.project as ProjectMeta | null) ?? null,
        recent,
        loading: false,
      });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : String(err), loading: false });
    }
  },

  open: async () => {
    const result = await projectApi.open();
    if (result.canceled) return;
    await useProjectStore.getState().refresh();
  },

  openPath: async (path: string) => {
    await projectApi.openPath(path);
    await useProjectStore.getState().refresh();
  },

  create: async () => {
    const result = await projectApi.create();
    if (result.canceled) return;
    await useProjectStore.getState().refresh();
  },

  close: async () => {
    await projectApi.close();
    set({ path: null, meta: null, isDirty: false });
  },

  loadRecent: async () => {
    const recent = await projectApi.listRecent();
    set({ recent });
  },

  setDirty: (dirty: boolean) => set({ isDirty: dirty }),
}));
