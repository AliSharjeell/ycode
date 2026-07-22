/**
 * Preload script — the only place where Node.js and the renderer meet.
 *
 * Exposes a constrained `window.api` surface to the renderer via
 * contextBridge. The renderer cannot reach Node directly.
 */
import { contextBridge, ipcRenderer } from 'electron';

type ProjectOpenResult =
  | { canceled: true }
  | { canceled: false; path: string };

const api = {
  /** Project lifecycle (open, save, close, list recent). */
  project: {
    open: (): Promise<ProjectOpenResult> => ipcRenderer.invoke('project:open'),
    openPath: (projectPath: string): Promise<{ ok: true } | { ok: false; error: string }> =>
      ipcRenderer.invoke('project:openPath', projectPath),
    create: (): Promise<ProjectOpenResult> => ipcRenderer.invoke('project:create'),
    close: (): Promise<{ ok: true }> => ipcRenderer.invoke('project:close'),
    current: (): Promise<{ path: string | null; project: unknown | null }> =>
      ipcRenderer.invoke('project:current'),
    listRecent: (): Promise<string[]> => ipcRenderer.invoke('project:listRecent'),
    clearRecent: (): Promise<{ ok: true }> => ipcRenderer.invoke('project:clearRecent'),
    readData: (kind: string): Promise<unknown> => ipcRenderer.invoke('project:readData', kind),
    writeData: (kind: string, payload: unknown): Promise<{ ok: true } | { ok: false; error: string }> =>
      ipcRenderer.invoke('project:writeData', kind, payload),
    deletePageLayers: (pageId: string): Promise<{ ok: true } | { ok: false; error: string }> =>
      ipcRenderer.invoke('project:deletePageLayers', pageId),
    addAsset: (
      buffer: ArrayBuffer,
      filename: string,
    ): Promise<{ ok: true; url: string } | { ok: false; error: string }> =>
      ipcRenderer.invoke('project:addAsset', buffer, filename),
    initGit: (opts: { commitInitial?: boolean }): Promise<{ ok: true } | { ok: false; error: string }> =>
      ipcRenderer.invoke('project:initGit', opts),
  },

  /** Git operations for the currently open project. */
  git: {
    status: (): Promise<unknown> => ipcRenderer.invoke('git:status'),
    log: (limit?: number): Promise<unknown> => ipcRenderer.invoke('git:log', limit),
    diff: (path: string): Promise<string> => ipcRenderer.invoke('git:diff', path),
    commit: (message: string): Promise<{ ok: true; sha: string } | { ok: false; error: string }> =>
      ipcRenderer.invoke('git:commit', message),
    branch: (): Promise<{ current: string; all: string[] }> => ipcRenderer.invoke('git:branch'),
    checkout: (branch: string): Promise<{ ok: true } | { ok: false; error: string }> =>
      ipcRenderer.invoke('git:checkout', branch),
    createBranch: (branch: string): Promise<{ ok: true } | { ok: false; error: string }> =>
      ipcRenderer.invoke('git:createBranch', branch),
    remote: (): Promise<{ name: string; url: string }[]> => ipcRenderer.invoke('git:remote'),
    addRemote: (name: string, url: string): Promise<{ ok: true } | { ok: false; error: string }> =>
      ipcRenderer.invoke('git:addRemote', name, url),
    push: (remote?: string, branch?: string): Promise<{ ok: true } | { ok: false; error: string }> =>
      ipcRenderer.invoke('git:push', remote, branch),
    pull: (remote?: string, branch?: string): Promise<{ ok: true } | { ok: false; error: string }> =>
      ipcRenderer.invoke('git:pull', remote, branch),
    fetch: (remote?: string): Promise<{ ok: true } | { ok: false; error: string }> =>
      ipcRenderer.invoke('git:fetch', remote),
  },

  /** GitHub OAuth Device Flow + repo management. */
  github: {
    startDeviceFlow: (): Promise<{
      userCode: string;
      verificationUri: string;
      deviceCode: string;
      interval: number;
    } | { ok: false; error: string }> => ipcRenderer.invoke('github:startDeviceFlow'),
    pollDeviceFlow: (deviceCode: string, interval: number): Promise<{ ok: true; login: string } | { ok: false; error: string; pending?: boolean }> =>
      ipcRenderer.invoke('github:pollDeviceFlow', deviceCode, interval),
    status: (): Promise<{ connected: boolean; login?: string }> => ipcRenderer.invoke('github:status'),
    disconnect: (): Promise<{ ok: true }> => ipcRenderer.invoke('github:disconnect'),
    listRepos: (): Promise<{ name: string; fullName: string; private: boolean; htmlUrl: string }[]> =>
      ipcRenderer.invoke('github:listRepos'),
    createRepo: (
      name: string,
      opts: { isPrivate: boolean; description?: string },
    ): Promise<{ ok: true; htmlUrl: string; cloneUrl: string } | { ok: false; error: string }> =>
      ipcRenderer.invoke('github:createRepo', name, opts),
  },

  /** Static site builder. */
  builder: {
    build: (): Promise<{ ok: true; outDir: string } | { ok: false; error: string }> =>
      ipcRenderer.invoke('builder:build'),
    preview: (): Promise<{ ok: true; url: string } | { ok: false; error: string }> =>
      ipcRenderer.invoke('builder:preview'),
    cancelPreview: (): Promise<{ ok: true }> => ipcRenderer.invoke('builder:cancelPreview'),
  },

  /** App-wide helpers. */
  app: {
    revealInFolder: (path: string): Promise<{ ok: true }> => ipcRenderer.invoke('app:revealInFolder', path),
    openExternal: (url: string): Promise<{ ok: true }> => ipcRenderer.invoke('app:openExternal', url),
    version: (): Promise<string> => ipcRenderer.invoke('app:version'),
    dataDir: (): Promise<string> => ipcRenderer.invoke('app:dataDir'),
  },

  /** Subscribe to events from the main process. */
  on: {
    projectChanged: (cb: () => void) => {
      const listener = () => cb();
      ipcRenderer.on('project:changed', listener);
      return () => ipcRenderer.removeListener('project:changed', listener);
    },
    gitChanged: (cb: () => void) => {
      const listener = () => cb();
      ipcRenderer.on('git:changed', listener);
      return () => ipcRenderer.removeListener('git:changed', listener);
    },
    menuAction: (cb: (action: string) => void) => {
      const listener = (_event: unknown, action: string) => cb(action);
      ipcRenderer.on('menu:action', listener);
      return () => ipcRenderer.removeListener('menu:action', listener);
    },
    buildProgress: (cb: (progress: { stage: string; percent: number; message?: string }) => void) => {
      const listener = (_event: unknown, progress: { stage: string; percent: number; message?: string }) =>
        cb(progress);
      ipcRenderer.on('builder:progress', listener);
      return () => ipcRenderer.removeListener('builder:progress', listener);
    },
  },
};

contextBridge.exposeInMainWorld('api', api);

export type YcodeApi = typeof api;
