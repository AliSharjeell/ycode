/**
 * Git IPC handlers — bridge the renderer to isomorphic-git.
 *
 * Most reads (status, log, diff, branch) are cheap; writes (commit, push,
 * pull) can be slow and are streamed as progress where it matters.
 */
import { BrowserWindow, IpcMain } from 'electron';
import { gitRepo } from '../../lib/git/operations';

type WindowGetter = () => BrowserWindow | null;

function repoOrError() {
  const repo = gitRepo.active();
  if (!repo) throw new Error('No project open');
  return repo;
}

export function registerGitHandlers(ipcMain: IpcMain, getWindow: WindowGetter): void {
  const notify = () => {
    const win = getWindow();
    if (win && !win.isDestroyed()) {
      win.webContents.send('git:changed');
    }
  };

  ipcMain.handle('git:status', async () => {
    try {
      return await repoOrError().status();
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : String(err));
    }
  });

  ipcMain.handle('git:log', async (_event, limit?: number) => {
    try {
      return await repoOrError().log(limit ?? 50);
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : String(err));
    }
  });

  ipcMain.handle('git:diff', async (_event, path: string) => {
    try {
      return await repoOrError().diff(path);
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : String(err));
    }
  });

  ipcMain.handle('git:commit', async (_event, message: string) => {
    try {
      const result = await repoOrError().commit(message);
      notify();
      return result;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      return { ok: false, error: msg } as const;
    }
  });

  ipcMain.handle('git:branch', async () => {
    try {
      return await repoOrError().branch();
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : String(err));
    }
  });

  ipcMain.handle('git:checkout', async (_event, branch: string) => {
    try {
      const result = await repoOrError().checkout(branch);
      notify();
      return result;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      return { ok: false, error: msg } as const;
    }
  });

  ipcMain.handle('git:createBranch', async (_event, branch: string) => {
    try {
      const result = await repoOrError().createBranch(branch);
      notify();
      return result;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      return { ok: false, error: msg } as const;
    }
  });

  ipcMain.handle('git:remote', async () => {
    try {
      return await repoOrError().remote();
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : String(err));
    }
  });

  ipcMain.handle('git:addRemote', async (_event, name: string, url: string) => {
    try {
      const result = await repoOrError().addRemote(name, url);
      notify();
      return result;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      return { ok: false, error: msg } as const;
    }
  });

  ipcMain.handle('git:push', async (_event, remote?: string, branch?: string) => {
    try {
      const result = await repoOrError().push(remote ?? 'origin', branch);
      notify();
      return result;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      return { ok: false, error: msg } as const;
    }
  });

  ipcMain.handle('git:pull', async (_event, remote?: string, branch?: string) => {
    try {
      const result = await repoOrError().pull(remote ?? 'origin', branch);
      notify();
      return result;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      return { ok: false, error: msg } as const;
    }
  });

  ipcMain.handle('git:fetch', async (_event, remote?: string) => {
    try {
      const result = await repoOrError().fetch(remote ?? 'origin');
      notify();
      return result;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      return { ok: false, error: msg } as const;
    }
  });
}
