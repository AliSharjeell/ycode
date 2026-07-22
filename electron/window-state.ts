/**
 * Persistent window state — width, height, x, y, maximized.
 */
import { app, BrowserWindow } from 'electron';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';

interface WindowState {
  width: number;
  height: number;
  x?: number;
  y?: number;
  maximized: boolean;
}

const DEFAULT_STATE: WindowState = {
  width: 1440,
  height: 900,
  maximized: false,
};

function statePath(): string {
  return path.join(app.getPath('userData'), 'window-state.json');
}

export async function loadWindowState(): Promise<WindowState> {
  try {
    const raw = await fs.readFile(statePath(), 'utf8');
    const parsed = JSON.parse(raw) as Partial<WindowState>;
    return {
      width: parsed.width ?? DEFAULT_STATE.width,
      height: parsed.height ?? DEFAULT_STATE.height,
      x: parsed.x,
      y: parsed.y,
      maximized: parsed.maximized ?? false,
    };
  } catch {
    return DEFAULT_STATE;
  }
}

export function saveWindowState(win: BrowserWindow): void {
  const state: WindowState = {
    width: win.getBounds().width,
    height: win.getBounds().height,
    x: win.getBounds().x,
    y: win.getBounds().y,
    maximized: win.isMaximized(),
  };
  fs.writeFile(statePath(), JSON.stringify(state, null, 2), 'utf8').catch(() => {
    // Best-effort; do not surface to the user.
  });
}
