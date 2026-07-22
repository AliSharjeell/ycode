/**
 * Renderer-side API client.
 *
 * Wraps the `window.api` IPC bridge so the existing visual-builder code
 * can call familiar methods (`pagesApi.list()`, etc.) without caring that
 * the underlying transport is IPC instead of HTTP.
 */
import type { Page, PageLayers, Component, LayerStyle, GlobalVariable, ColorVariable, Font, Settings } from '../types';

declare global {
  interface Window {
    api?: {
      project: {
        open: () => Promise<{ canceled: true } | { canceled: false; path: string }>;
        openPath: (projectPath: string) => Promise<{ ok: true } | { ok: false; error: string }>;
        create: () => Promise<{ canceled: true } | { canceled: false; path: string }>;
        close: () => Promise<{ ok: true }>;
        current: () => Promise<{ path: string | null; project: unknown | null }>;
        listRecent: () => Promise<string[]>;
        clearRecent: () => Promise<{ ok: true }>;
        readData: (kind: string) => Promise<unknown>;
        writeData: (kind: string, payload: unknown) => Promise<{ ok: true } | { ok: false; error: string }>;
        deletePageLayers: (pageId: string) => Promise<{ ok: true } | { ok: false; error: string }>;
        addAsset: (buffer: ArrayBuffer, filename: string) => Promise<{ ok: true; url: string } | { ok: false; error: string }>;
        initGit: (opts: { commitInitial?: boolean }) => Promise<{ ok: true } | { ok: false; error: string }>;
      };
      git: {
        status: () => Promise<unknown>;
        log: (limit?: number) => Promise<unknown>;
        diff: (path: string) => Promise<string>;
        commit: (message: string) => Promise<{ ok: true; sha: string } | { ok: false; error: string }>;
        branch: () => Promise<{ current: string; all: string[] }>;
        checkout: (branch: string) => Promise<{ ok: true } | { ok: false; error: string }>;
        createBranch: (branch: string) => Promise<{ ok: true } | { ok: false; error: string }>;
        remote: () => Promise<{ name: string; url: string }[]>;
        addRemote: (name: string, url: string) => Promise<{ ok: true } | { ok: false; error: string }>;
        push: (remote?: string, branch?: string) => Promise<{ ok: true } | { ok: false; error: string }>;
        pull: (remote?: string, branch?: string) => Promise<{ ok: true } | { ok: false; error: string }>;
        fetch: (remote?: string) => Promise<{ ok: true } | { ok: false; error: string }>;
      };
      github: {
        startDeviceFlow: () => Promise<any>;
        pollDeviceFlow: (deviceCode: string, interval: number) => Promise<any>;
        status: () => Promise<{ connected: boolean; login?: string }>;
        disconnect: () => Promise<{ ok: true }>;
        listRepos: () => Promise<any[]>;
        createRepo: (name: string, opts: { isPrivate: boolean; description?: string }) => Promise<any>;
      };
      builder: {
        build: () => Promise<{ ok: true; outDir: string } | { ok: false; error: string }>;
        preview: () => Promise<{ ok: true; url: string } | { ok: false; error: string }>;
        cancelPreview: () => Promise<{ ok: true }>;
      };
      app: {
        revealInFolder: (path: string) => Promise<{ ok: true }>;
        openExternal: (url: string) => Promise<{ ok: true }>;
        version: () => Promise<string>;
        dataDir: () => Promise<string>;
      };
      on: {
        projectChanged: (cb: () => void) => () => void;
        gitChanged: (cb: () => void) => () => void;
        menuAction: (cb: (action: string) => void) => () => void;
        buildProgress: (cb: (p: any) => void) => () => void;
      };
    };
  }
}

function isElectron(): boolean {
  return typeof window !== 'undefined' && typeof window.api !== 'undefined';
}

async function ipc<T>(path: string, ...args: unknown[]): Promise<T> {
  if (!isElectron()) {
    throw new Error(`Renderer API not available — running outside Electron. Tried: ${path}`);
  }
  const [ns, method] = path.split(':') as [string, string];
  const fn = (window.api as any)[ns]?.[method];
  if (typeof fn !== 'function') {
    throw new Error(`Unknown API: ${path}`);
  }
  return fn(...args) as Promise<T>;
}

export const projectApi = {
  open: () => ipc<{ canceled: true } | { canceled: false; path: string }>('project:open'),
  openPath: (projectPath: string) => ipc<{ ok: true } | { ok: false; error: string }>('project:openPath', projectPath),
  create: () => ipc<{ canceled: true } | { canceled: false; path: string }>('project:create'),
  close: () => ipc<{ ok: true }>('project:close'),
  current: () => ipc<{ path: string | null; project: unknown | null }>('project:current'),
  listRecent: () => ipc<string[]>('project:listRecent'),
};

export const pagesApi = {
  list: async (): Promise<Page[]> => (await ipc<unknown>('project:readData', 'pages')) as Page[],
  save: (pages: Page[]) => ipc<{ ok: true } | { ok: false; error: string }>('project:writeData', 'pages', pages),
};

// Legacy alias used by the editor's PagesTree.
export const foldersApi = {
  list: async (): Promise<any[]> => (await ipc<unknown>('project:readData', 'page-folders')) as any[],
  save: (folders: any[]) =>
    ipc<{ ok: true } | { ok: false; error: string }>('project:writeData', 'page-folders', folders),
};

// Legacy alias used by useGlobalsStore.
export const globalVariablesApi = globalsApi;

export const pageLayersApi = {
  get: async (pageId: string): Promise<PageLayers> => {
    if (!isElectron()) return { id: pageId, page_id: pageId, layers: [], is_published: false };
    return (await ipc<unknown>('project:readData', `layers-${pageId}`)) as PageLayers;
  },
  save: (pageId: string, payload: PageLayers) =>
    ipc<{ ok: true } | { ok: false; error: string }>('project:writeData', `layers-${pageId}`, payload),
};

export const componentsApi = {
  list: async (): Promise<Component[]> => (await ipc<unknown>('project:readData', 'components')) as Component[],
  save: (components: Component[]) =>
    ipc<{ ok: true } | { ok: false; error: string }>('project:writeData', 'components', components),
};

export const layerStylesApi = {
  list: async (): Promise<LayerStyle[]> => (await ipc<unknown>('project:readData', 'layer-styles')) as LayerStyle[],
  save: (styles: LayerStyle[]) =>
    ipc<{ ok: true } | { ok: false; error: string }>('project:writeData', 'layer-styles', styles),
};

export const globalsApi = {
  list: async (): Promise<GlobalVariable[]> => (await ipc<unknown>('project:readData', 'globals')) as GlobalVariable[],
  save: (globals: GlobalVariable[]) =>
    ipc<{ ok: true } | { ok: false; error: string }>('project:writeData', 'globals', globals),
};

export const colorVariablesApi = {
  list: async (): Promise<ColorVariable[]> => (await ipc<unknown>('project:readData', 'color-variables')) as ColorVariable[],
  save: (vars: ColorVariable[]) =>
    ipc<{ ok: true } | { ok: false; error: string }>('project:writeData', 'color-variables', vars),
};

export const fontsApi = {
  list: async (): Promise<Font[]> => (await ipc<unknown>('project:readData', 'fonts')) as Font[],
  save: (fonts: Font[]) =>
    ipc<{ ok: true } | { ok: false; error: string }>('project:writeData', 'fonts', fonts),
};

export const settingsApi = {
  get: async (): Promise<Settings> => (await ipc<unknown>('project:readData', 'settings')) as Settings,
  save: (settings: Settings) =>
    ipc<{ ok: true } | { ok: false; error: string }>('project:writeData', 'settings', settings),
};

export const gitApi = {
  status: () => ipc<{ file: string; type: string }[]>('git:status'),
  log: (limit = 50) => ipc<unknown>('git:log', limit),
  diff: (path: string) => ipc<string>('git:diff', path),
  commit: (message: string) => ipc<{ ok: true; sha: string } | { ok: false; error: string }>('git:commit', message),
  branch: () => ipc<{ current: string; all: string[] }>('git:branch'),
  checkout: (branch: string) => ipc<{ ok: true } | { ok: false; error: string }>('git:checkout', branch),
  createBranch: (branch: string) => ipc<{ ok: true } | { ok: false; error: string }>('git:createBranch', branch),
  remote: () => ipc<{ name: string; url: string }[]>('git:remote'),
  addRemote: (name: string, url: string) => ipc<{ ok: true } | { ok: false; error: string }>('git:addRemote', name, url),
  push: (remote?: string, branch?: string) => ipc<{ ok: true } | { ok: false; error: string }>('git:push', remote, branch),
  pull: (remote?: string, branch?: string) => ipc<{ ok: true } | { ok: false; error: string }>('git:pull', remote, branch),
  fetch: (remote?: string) => ipc<{ ok: true } | { ok: false; error: string }>('git:fetch', remote),
  init: (commitInitial = true) => ipc<{ ok: true } | { ok: false; error: string }>('project:initGit', { commitInitial }),
};

export const githubApi = {
  startDeviceFlow: () => ipc<any>('github:startDeviceFlow'),
  pollDeviceFlow: (deviceCode: string, interval: number) => ipc<any>('github:pollDeviceFlow', deviceCode, interval),
  status: () => ipc<{ connected: boolean; login?: string }>('github:status'),
  disconnect: () => ipc<{ ok: true }>('github:disconnect'),
  listRepos: () => ipc<any[]>('github:listRepos'),
  createRepo: (name: string, opts: { isPrivate: boolean; description?: string }) =>
    ipc<{ ok: true; htmlUrl: string; cloneUrl: string } | { ok: false; error: string }>('github:createRepo', name, opts),
};

export const builderApi = {
  build: () => ipc<{ ok: true; outDir: string } | { ok: false; error: string }>('builder:build'),
  preview: () => ipc<{ ok: true; url: string } | { ok: false; error: string }>('builder:preview'),
  cancelPreview: () => ipc<{ ok: true }>('builder:cancelPreview'),
};

export function isDesktop(): boolean {
  return isElectron();
}

// Legacy stubs for removed APIs that the editor code still references.
export const publishApi = {
  publish: async (): Promise<{ ok: true } | { ok: false; error: string }> => {
    return { ok: false, error: 'Publishing is now done via the Build Site button.' };
  },
  unpublish: async (): Promise<{ ok: true } | { ok: false; error: string }> => {
    return { ok: true };
  },
  preview: async (): Promise<{ ok: true; url: string } | { ok: false; error: string }> => {
    return builderApi.preview();
  },
};

export const editorApi = {
  init: async (): Promise<{ ok: true }> => ({ ok: true }),
};

export const redirectsApi = {
  list: async (): Promise<any[]> => (await ipc<unknown>('project:readData', 'redirects')) as any[],
  save: (redirects: any[]) => ipc<{ ok: true } | { ok: false; error: string }>('project:writeData', 'redirects', redirects),
};

export const assetsApi = {
  list: async (): Promise<any[]> => (await ipc<unknown>('project:readData', 'assets')) as any[],
  save: (assets: any[]) => ipc<{ ok: true } | { ok: false; error: string }>('project:writeData', 'assets', assets),
};

export const assetFoldersApi = {
  list: async (): Promise<any[]> => (await ipc<unknown>('project:readData', 'asset-folders')) as any[],
  save: (folders: any[]) => ipc<{ ok: true } | { ok: false; error: string }>('project:writeData', 'asset-folders', folders),
};

export const uploadFileApi = {
  upload: async (): Promise<{ ok: true; url: string } | { ok: false; error: string }> => {
    return { ok: false, error: 'Use projectApi.addAsset instead.' };
  },
};

export const aiChatsApi = {
  list: async () => [],
  save: async () => ({ ok: true }),
  delete: async () => ({ ok: true }),
};

export const updateNotificationApi = {
  check: async () => ({ available: false }),
};

export const supabaseConfigApi = {
  get: async () => null,
};

export const versionsApi = {
  list: async () => [],
  save: async () => ({ ok: true }),
};

export const credentialsApi = {
  list: async () => [],
  save: async () => ({ ok: true }),
};

export const apiKeysApi = {
  list: async () => [],
  save: async () => ({ ok: true }),
};

export const webhooksApi = {
  list: async () => [],
  save: async () => ({ ok: true }),
};

export const mcpTokensApi = {
  list: async () => [],
  save: async () => ({ ok: true }),
};

export const staticExportApi = {
  start: async () => ({ ok: false, error: 'Use Build Site instead.' }),
  status: async () => ({ running: false, progress: 0 }),
};

export const collectionItemsApi = {
  list: async () => [],
  save: async () => ({ ok: true }),
};

export const collectionFieldsApi = {
  list: async () => [],
  save: async () => ({ ok: true }),
};

export const collectionsApi = {
  list: async () => [],
  save: async () => ({ ok: true }),
};

export const formsApi = {
  list: async () => [],
  save: async () => ({ ok: true }),
};

export const airtableApi = {
  list: async () => [],
  save: async () => ({ ok: true }),
};

export const mailerliteApi = {
  list: async () => [],
  save: async () => ({ ok: true }),
};

export const webflowApi = {
  list: async () => [],
  save: async () => ({ ok: true }),
};

export const mapsApi = {
  geocode: async () => null,
};

export const mapsServerApi = {
  geocode: async () => null,
};

export const layoutsApi = {
  list: async () => [],
  save: async () => ({ ok: true }),
};
