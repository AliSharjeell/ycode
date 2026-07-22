/**
 * ProjectManager — the file-system authority for a single Ycode project.
 *
 * A project is a folder on disk with this layout:
 *
 *   <project>/
 *   ├── .ycode/
 *   │   ├── project.json          # metadata
 *   │   └── config.json           # local editor config
 *   ├── data/
 *   │   ├── pages.json
 *   │   ├── settings.json
 *   │   ├── globals.json
 *   │   ├── color-variables.json
 *   │   ├── fonts.json
 *   │   ├── layer-styles.json
 *   │   ├── components.json
 *   │   ├── redirects.json
 *   │   └── layers/<pageId>.json
 *   ├── assets/
 *   │   ├── images/
 *   │   └── fonts/
 *   └── out/                      # generated static site
 *
 * The ProjectManager is a singleton-with-key: there's exactly one active
 * project at a time, and the active project is keyed by absolute path.
 *
 * The class is process-local because the Electron main process is single-
 * threaded. The renderer calls into it via IPC.
 */
import * as fs from 'node:fs/promises';
import * as fsSync from 'node:fs';
import * as path from 'node:path';
import * as crypto from 'node:crypto';
import { GitRepo } from '../git/operations';

interface ProjectMeta {
  id: string;
  name: string;
  createdAt: string;
  lastOpenedAt: string;
}

interface ProjectConfig {
  editor: Record<string, unknown>;
  includeOutInGit: boolean;
}

const DATA_SCHEMA_VERSION = 1;

export class ProjectManager {
  private static current: ProjectManager | null = null;

  static active(): ProjectManager | null {
    return ProjectManager.current;
  }

  static setActive(p: ProjectManager): void {
    ProjectManager.current = p;
  }

  static closeActive(): void {
    ProjectManager.current = null;
  }

  constructor(public readonly path: string) {}

  /** Lazily create .ycode/, data/, assets/, out/ if absent. */
  async initialize(): Promise<void> {
    await fs.mkdir(path.join(this.path, '.ycode'), { recursive: true });
    await fs.mkdir(path.join(this.path, 'data', 'layers'), { recursive: true });
    await fs.mkdir(path.join(this.path, 'assets', 'images'), { recursive: true });
    await fs.mkdir(path.join(this.path, 'assets', 'fonts'), { recursive: true });
    await fs.mkdir(path.join(this.path, 'out'), { recursive: true });

    const projectFile = path.join(this.path, '.ycode', 'project.json');
    if (!fsSync.existsSync(projectFile)) {
      const meta: ProjectMeta = {
        id: crypto.randomUUID(),
        name: path.basename(this.path),
        createdAt: new Date().toISOString(),
        lastOpenedAt: new Date().toISOString(),
      };
      await fs.writeFile(projectFile, JSON.stringify(meta, null, 2), 'utf8');
    } else {
      const meta = await this.readProject();
      meta.lastOpenedAt = new Date().toISOString();
      await fs.writeFile(projectFile, JSON.stringify(meta, null, 2), 'utf8');
    }

    const configFile = path.join(this.path, '.ycode', 'config.json');
    if (!fsSync.existsSync(configFile)) {
      const config: ProjectConfig = {
        editor: {},
        includeOutInGit: false,
      };
      await fs.writeFile(configFile, JSON.stringify(config, null, 2), 'utf8');
    }

    ProjectManager.setActive(this);
  }

  async readProject(): Promise<ProjectMeta> {
    const raw = await fs.readFile(path.join(this.path, '.ycode', 'project.json'), 'utf8');
    return JSON.parse(raw);
  }

  async readConfig(): Promise<ProjectConfig> {
    try {
      const raw = await fs.readFile(path.join(this.path, '.ycode', 'config.json'), 'utf8');
      return JSON.parse(raw);
    } catch {
      return { editor: {}, includeOutInGit: false };
    }
  }

  /**
   * Read a top-level data file by kind. Kinds map to single JSON files in
   * data/ except for `layers` which reads from data/layers/<pageId>.json.
   */
  async readData(kind: string): Promise<unknown> {
    if (kind === 'layers') {
      // Layers are per-page; the renderer should ask for one page at a time.
      throw new Error('Use readPageLayers(pageId) for layers');
    }
    const file = path.join(this.path, 'data', `${kind}.json`);
    if (!fsSync.existsSync(file)) {
      return defaultPayloadFor(kind);
    }
    const raw = await fs.readFile(file, 'utf8');
    return JSON.parse(raw);
  }

  async readPageLayers(pageId: string): Promise<unknown> {
    const file = path.join(this.path, 'data', 'layers', `${pageId}.json`);
    if (!fsSync.existsSync(file)) {
      return { id: pageId, page_id: pageId, layers: [], is_published: false };
    }
    const raw = await fs.readFile(file, 'utf8');
    return JSON.parse(raw);
  }

  async writeData(kind: string, payload: unknown): Promise<void> {
    if (kind === 'layers') {
      throw new Error('Use writePageLayers(pageId, payload) for layers');
    }
    const file = path.join(this.path, 'data', `${kind}.json`);
    await atomicWrite(file, JSON.stringify(payload, null, 2));
    // Notify the renderer that project data changed.
    notifyChanged(this.path);
  }

  async writePageLayers(pageId: string, payload: unknown): Promise<void> {
    const file = path.join(this.path, 'data', 'layers', `${pageId}.json`);
    await atomicWrite(file, JSON.stringify(payload, null, 2));
    notifyChanged(this.path);
  }

  async deletePageLayers(pageId: string): Promise<void> {
    const file = path.join(this.path, 'data', 'layers', `${pageId}.json`);
    if (fsSync.existsSync(file)) {
      await fs.unlink(file);
      notifyChanged(this.path);
    }
  }

  async addAsset(buffer: Buffer, filename: string): Promise<string> {
    const safeName = sanitizeFilename(filename);
    const target = path.join(this.path, 'assets', 'images', safeName);
    await fs.writeFile(target, buffer);
    const hash = crypto.createHash('sha1').update(this.path).digest('hex').slice(0, 16);
    return `ycode-asset://${hash}/images/${safeName}`;
  }

  async initGit(commitInitial: boolean): Promise<void> {
    const repo = new GitRepo(this.path);
    await repo.init();
    if (commitInitial) {
      await repo.commitInitial();
    }
  }
}

function defaultPayloadFor(kind: string): unknown {
  switch (kind) {
    case 'pages':
      return [];
    case 'components':
      return [];
    case 'layer-styles':
      return [];
    case 'settings':
      return {};
    case 'globals':
      return [];
    case 'fonts':
      return [];
    case 'color-variables':
      return [];
    case 'redirects':
      return [];
    default:
      return null;
  }
}

async function atomicWrite(file: string, contents: string): Promise<void> {
  const tmp = `${file}.${process.pid}.${Date.now()}.tmp`;
  await fs.writeFile(tmp, contents, 'utf8');
  await fs.rename(tmp, file);
}

function sanitizeFilename(name: string): string {
  // Strip path separators and control chars; keep the extension.
  const base = name.replace(/[\\/]/g, '_').replace(/[^a-zA-Z0-9._\-]/g, '_');
  return base.length > 0 ? base : 'asset';
}

const changeListeners: Set<(projectPath: string) => void> = new Set();

export function onProjectChange(listener: (projectPath: string) => void): () => void {
  changeListeners.add(listener);
  return () => changeListeners.delete(listener);
}

function notifyChanged(projectPath: string): void {
  for (const listener of changeListeners) {
    try {
      listener(projectPath);
    } catch {
      // ignore
    }
  }
}
