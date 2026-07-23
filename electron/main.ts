/**
 * Electron main process entry point.
 *
 * Responsibilities:
 * - Create the BrowserWindow that loads the Next.js renderer.
 * - Register the IPC handlers that the renderer uses to talk to the OS.
 * - Register custom `ycode-asset://` and `ycode-project://` protocols so the
 *   renderer can resolve project files without using file:// (which is
 *   restricted in modern Electron).
 * - Hook up the native application menu.
 * - Persist window state across launches.
 */
import { app, BrowserWindow, ipcMain, protocol, shell, dialog } from 'electron';
import * as path from 'node:path';
import * as fs from 'node:fs/promises';
import { registerProjectHandlers } from './ipc/project';
import { registerGitHandlers } from './ipc/git';
import { registerGitHubHandlers } from './ipc/github';
import { registerBuilderHandlers } from './ipc/builder';
import { registerAssetProtocol } from './protocols';
import { buildAppMenu } from './menu';
import { loadWindowState, saveWindowState } from './window-state';

const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

let mainWindow: BrowserWindow | null = null;

async function createWindow(): Promise<void> {
  const windowState = await loadWindowState();

  mainWindow = new BrowserWindow({
    width: windowState.width,
    height: windowState.height,
    x: windowState.x,
    y: windowState.y,
    minWidth: 1024,
    minHeight: 700,
    title: 'Ycode',
    backgroundColor: '#0b0b0c',
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  if (windowState.maximized) {
    mainWindow.maximize();
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
  });

  mainWindow.on('close', () => {
    if (mainWindow) {
      saveWindowState(mainWindow);
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // External links open in the system browser, not inside the app.
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  if (isDev) {
    const devUrl = process.env.YCODE_DEV_URL ?? 'http://localhost:3002';
    await mainWindow.loadURL(devUrl);
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  } else {
    // Static export ships to out/ (renderer build output).
    const indexPath = path.join(__dirname, '..', 'out', 'index.html');
    await mainWindow.loadFile(indexPath);
  }
}

// Register custom protocols BEFORE app is ready.
// (Schemes must be registered as privileged before app.whenReady fires.)
protocol.registerSchemesAsPrivileged([
  {
    scheme: 'ycode-asset',
    privileges: { standard: true, secure: true, supportFetchAPI: true, bypassCSP: true },
  },
  {
    scheme: 'ycode-project',
    privileges: { standard: true, secure: true, supportFetchAPI: true, bypassCSP: true },
  },
]);

app.whenReady().then(async () => {
  await registerAssetProtocol();
  registerProjectHandlers(ipcMain, () => mainWindow);
  registerGitHandlers(ipcMain, () => mainWindow);
  registerGitHubHandlers(ipcMain, () => mainWindow);
  registerBuilderHandlers(ipcMain, () => mainWindow);

  await createWindow();
  if (mainWindow) {
    buildAppMenu(mainWindow);
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Reject any new webContents from being created unexpectedly.
app.on('web-contents-created', (_, contents) => {
  contents.on('will-navigate', (event, url) => {
    const allowed = isDev && url.startsWith(process.env.YCODE_DEV_URL ?? 'http://localhost:3002');
    if (!allowed) {
      event.preventDefault();
      shell.openExternal(url);
    }
  });
});
