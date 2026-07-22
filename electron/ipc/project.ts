/**
 * Project lifecycle IPC handlers.
 *
 * The renderer asks the main process to open, create, close, or read a
 * project. The main process is the file-system authority; the renderer
 * never touches fs directly.
 */
import { app, BrowserWindow, dialog, IpcMain } from 'electron';
import * as path from 'node:path';
import * as fs from 'node:fs/promises';
import * as fsSync from 'node:fs';
import { ProjectManager } from '../../lib/projects/project-manager';
import { RecentProjects } from '../../lib/projects/recent-projects';

const recent = new RecentProjects(path.join(app.getPath('userData'), 'recent-projects.json'));

type WindowGetter = () => BrowserWindow | null;

async function pickFolder(
  win: BrowserWindow | null,
  opts: { title: string; defaultPath?: string },
): Promise<string | null> {
  const optsElectron: Electron.OpenDialogOptions = {
    title: opts.title,
    properties: ['openDirectory', 'createDirectory'],
    defaultPath: opts.defaultPath,
  };
  const result = win
    ? await dialog.showOpenDialog(win, optsElectron)
    : await dialog.showOpenDialog(optsElectron);
  if (result.canceled || result.filePaths.length === 0) return null;
  return result.filePaths[0];
}

async function ensureProject(projectPath: string): Promise<ProjectManager> {
  const manager = new ProjectManager(projectPath);
  await manager.initialize();
  return manager;
}

export function registerProjectHandlers(ipcMain: IpcMain, getWindow: WindowGetter): void {
  ipcMain.handle('project:open', async () => {
    const win = getWindow();
    const folder = await pickFolder(win, { title: 'Open Ycode project' });
    if (!folder) return { canceled: true };
    try {
      await ensureProject(folder);
      recent.add(folder);
      return { canceled: false, path: folder };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      return { canceled: false, path: folder } as const;
    }
  });

  ipcMain.handle('project:openPath', async (_event, projectPath: string) => {
    try {
      await ensureProject(projectPath);
      recent.add(projectPath);
      return { ok: true };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      return { ok: false, error: msg };
    }
  });

  ipcMain.handle('project:create', async () => {
    const win = getWindow();
    const folder = await pickFolder(win, { title: 'Create new Ycode project' });
    if (!folder) return { canceled: true };
    await fs.mkdir(path.join(folder, 'data', 'layers'), { recursive: true });
    await fs.mkdir(path.join(folder, 'assets', 'images'), { recursive: true });
    await fs.mkdir(path.join(folder, 'assets', 'fonts'), { recursive: true });
    await fs.mkdir(path.join(folder, 'out'), { recursive: true });
    const project = {
      id: crypto.randomUUID(),
      name: path.basename(folder),
      createdAt: new Date().toISOString(),
      lastOpenedAt: new Date().toISOString(),
    };
    await fs.writeFile(
      path.join(folder, '.ycode', 'project.json'),
      JSON.stringify(project, null, 2),
      'utf8',
    );
    await fs.writeFile(
      path.join(folder, '.ycode', 'config.json'),
      JSON.stringify({ editor: {}, includeOutInGit: false }, null, 2),
      'utf8',
    );
    recent.add(folder);
    return { canceled: false, path: folder };
  });

  ipcMain.handle('project:close', async () => {
    ProjectManager.closeActive();
    return { ok: true } as const;
  });

  ipcMain.handle('project:current', async () => {
    const active = ProjectManager.active();
    if (!active) return { path: null, project: null };
    return { path: active.path, project: await active.readProject() };
  });

  ipcMain.handle('project:listRecent', async () => recent.list());

  ipcMain.handle('project:clearRecent', async () => {
    await recent.clear();
    return { ok: true } as const;
  });

  ipcMain.handle('project:readData', async (_event, kind: string) => {
    const active = ProjectManager.active();
    if (!active) throw new Error('No project open');
    return active.readData(kind);
  });

  ipcMain.handle('project:writeData', async (_event, kind: string, payload: unknown) => {
    const active = ProjectManager.active();
    if (!active) return { ok: false, error: 'No project open' } as const;
    try {
      await active.writeData(kind, payload);
      return { ok: true } as const;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      return { ok: false, error: msg } as const;
    }
  });

  ipcMain.handle('project:deletePageLayers', async (_event, pageId: string) => {
    const active = ProjectManager.active();
    if (!active) return { ok: false, error: 'No project open' } as const;
    try {
      await active.deletePageLayers(pageId);
      return { ok: true } as const;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      return { ok: false, error: msg } as const;
    }
  });

  ipcMain.handle('project:addAsset', async (_event, buffer: ArrayBuffer, filename: string) => {
    const active = ProjectManager.active();
    if (!active) return { ok: false, error: 'No project open' } as const;
    try {
      const url = await active.addAsset(Buffer.from(buffer), filename);
      return { ok: true, url } as const;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      return { ok: false, error: msg } as const;
    }
  });

  ipcMain.handle('project:initGit', async (_event, opts: { commitInitial?: boolean }) => {
    const active = ProjectManager.active();
    if (!active) return { ok: false, error: 'No project open' } as const;
    try {
      await active.initGit(opts.commitInitial ?? true);
      return { ok: true } as const;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      return { ok: false, error: msg } as const;
    }
  });
}
