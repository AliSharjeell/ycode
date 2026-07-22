/**
 * Custom protocol registration.
 *
 * Two registered schemes:
 * - `ycode-asset://<projectHash>/<relative-path>` — serves files from the
 *   currently open project's `assets/` folder. The hash is the SHA-1 of
 *   the project path so multiple projects can share the same BrowserWindow.
 * - `ycode-project://<projectHash>/<relative-path>` — serves files from the
 *   project's data/ folder (for the in-app preview).
 *
 * Both schemes are registered as privileged in main.ts.
 */
import { protocol, net } from 'electron';
import * as path from 'node:path';
import * as crypto from 'node:crypto';
import * as fs from 'node:fs';
import { ProjectManager } from '../lib/projects/project-manager';

function projectHashFor(projectPath: string): string {
  return crypto.createHash('sha1').update(projectPath).digest('hex').slice(0, 16);
}

function resolveProjectBaseUrl(url: string, folder: 'assets' | 'data'): string | null {
  // url is ycode-asset://<hash>/<rest> or ycode-project://<hash>/<rest>
  const stripped = url.replace(/^ycode-(?:asset|project):\/\//, '');
  const slash = stripped.indexOf('/');
  if (slash === -1) return null;
  const hash = stripped.slice(0, slash);
  const rest = stripped.slice(slash + 1);
  const active = ProjectManager.active();
  if (!active) return null;
  if (projectHashFor(active.path) !== hash) return null;
  return path.join(active.path, folder, rest);
}

export async function registerAssetProtocol(): Promise<void> {
  protocol.handle('ycode-asset', async (request) => {
    const filePath = resolveProjectBaseUrl(request.url, 'assets');
    if (!filePath) return new Response('Not found', { status: 404 });
    if (!fs.existsSync(filePath)) return new Response('Not found', { status: 404 });
    return net.fetch(`file://${filePath.replace(/\\/g, '/')}`);
  });

  protocol.handle('ycode-project', async (request) => {
    const filePath = resolveProjectBaseUrl(request.url, 'data');
    if (!filePath) return new Response('Not found', { status: 404 });
    if (!fs.existsSync(filePath)) return new Response('Not found', { status: 404 });
    return net.fetch(`file://${filePath.replace(/\\/g, '/')}`);
  });
}
