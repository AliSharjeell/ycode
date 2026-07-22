/**
 * GitHub OAuth Device Flow + repo management IPC handlers.
 *
 * The token is stored in the OS keychain via Electron's safeStorage. The
 * renderer never sees the token; it only asks the main process to perform
 * GitHub API calls.
 */
import { app, BrowserWindow, IpcMain, safeStorage } from 'electron';
import * as path from 'node:path';
import * as fs from 'node:fs/promises';
import { GitHubClient } from '../../lib/github/client';
import { TokenStore } from '../../lib/github/token';

type WindowGetter = () => BrowserWindow | null;

function tokenStore() {
  const file = path.join(app.getPath('userData'), 'github-token.enc');
  return new TokenStore(file);
}

export function registerGitHubHandlers(ipcMain: IpcMain, getWindow: WindowGetter): void {
  ipcMain.handle('github:startDeviceFlow', async () => {
    try {
      const client = new GitHubClient({ token: null });
      return await client.requestDeviceCode();
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      return { ok: false, error: msg } as const;
    }
  });

  ipcMain.handle(
    'github:pollDeviceFlow',
    async (_event, deviceCode: string, interval: number) => {
      try {
        const client = new GitHubClient({ token: null });
        const token = await client.pollForToken(deviceCode, interval);
        await tokenStore().save(token.access_token);
        const authed = new GitHubClient({ token: token.access_token });
        const user = await authed.getAuthenticatedUser();
        return { ok: true, login: user.login } as const;
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        // Distinguish "still pending" from real errors. GitHub returns
        // authorization_pending; we treat that as "pending" so the UI can
        // keep polling.
        if (msg.includes('authorization_pending')) {
          return { ok: false, error: msg, pending: true } as const;
        }
        return { ok: false, error: msg } as const;
      }
    },
  );

  ipcMain.handle('github:status', async () => {
    const token = await tokenStore().load();
    if (!token) return { connected: false };
    try {
      const authed = new GitHubClient({ token });
      const user = await authed.getAuthenticatedUser();
      return { connected: true, login: user.login };
    } catch {
      return { connected: false };
    }
  });

  ipcMain.handle('github:disconnect', async () => {
    await tokenStore().clear();
    return { ok: true } as const;
  });

  ipcMain.handle('github:listRepos', async () => {
    const token = await tokenStore().load();
    if (!token) throw new Error('Not connected to GitHub');
    const client = new GitHubClient({ token });
    return client.listRepos();
  });

  ipcMain.handle(
    'github:createRepo',
    async (_event, name: string, opts: { isPrivate: boolean; description?: string }) => {
      try {
        const token = await tokenStore().load();
        if (!token) return { ok: false, error: 'Not connected to GitHub' } as const;
        const client = new GitHubClient({ token });
        const repo = await client.createRepo(name, opts);
        return { ok: true, htmlUrl: repo.html_url, cloneUrl: repo.clone_url } as const;
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        return { ok: false, error: msg } as const;
      }
    },
  );
}
