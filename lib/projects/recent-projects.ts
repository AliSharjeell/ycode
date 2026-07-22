/**
 * Recent projects list — small JSON file in userData.
 *
 * Most-recent-first, capped at 10 entries. Used by the welcome screen and
 * the File > Open Recent menu.
 */
import * as fs from 'node:fs/promises';

const MAX_RECENT = 10;

export class RecentProjects {
  constructor(private readonly filePath: string) {}

  async list(): Promise<string[]> {
    try {
      const raw = await fs.readFile(this.filePath, 'utf8');
      const parsed = JSON.parse(raw) as string[];
      return Array.isArray(parsed) ? parsed.slice(0, MAX_RECENT) : [];
    } catch {
      return [];
    }
  }

  async add(projectPath: string): Promise<void> {
    const current = await this.list();
    const next = [projectPath, ...current.filter((p) => p !== projectPath)].slice(0, MAX_RECENT);
    await fs.writeFile(this.filePath, JSON.stringify(next, null, 2), 'utf8');
  }

  async clear(): Promise<void> {
    try {
      await fs.unlink(this.filePath);
    } catch {
      // already gone
    }
  }
}
