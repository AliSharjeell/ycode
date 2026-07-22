/**
 * Static-site builder IPC handlers.
 *
 * The renderer triggers a build; the main process walks the project's
 * data/, renders every page to HTML, and writes the result to out/.
 * Progress is streamed back via the `builder:progress` event.
 */
import { BrowserWindow, IpcMain } from 'electron';
import { ProjectManager } from '../../lib/projects/project-manager';
import { buildSite } from '../../lib/static-export';
import { PreviewServer } from '../../lib/static-export/preview-server';

type WindowGetter = () => BrowserWindow | null;

const preview = new PreviewServer();

export function registerBuilderHandlers(ipcMain: IpcMain, getWindow: WindowGetter): void {
  const emitProgress = (progress: { stage: string; percent: number; message?: string }) => {
    const win = getWindow();
    if (win && !win.isDestroyed()) {
      win.webContents.send('builder:progress', progress);
    }
  };

  ipcMain.handle('builder:build', async () => {
    const active = ProjectManager.active();
    if (!active) return { ok: false, error: 'No project open' } as const;
    try {
      const outDir = await buildSite(active.path, emitProgress);
      return { ok: true, outDir } as const;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      return { ok: false, error: msg } as const;
    }
  });

  ipcMain.handle('builder:preview', async () => {
    const active = ProjectManager.active();
    if (!active) return { ok: false, error: 'No project open' } as const;
    try {
      const url = await preview.start(active.path);
      return { ok: true, url } as const;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      return { ok: false, error: msg } as const;
    }
  });

  ipcMain.handle('builder:cancelPreview', async () => {
    await preview.stop();
    return { ok: true } as const;
  });
}
