/**
 * Pages repository — file-backed.
 *
 * Mirrors the old pageRepository API but reads/writes data/pages.json and
 * data/layers/<pageId>.json directly. The active project must be open
 * (ProjectManager.active() is non-null).
 */
import { ProjectManager } from '../project-manager';
import type { Page } from '../../../types';

export const pagesRepository = {
  async list(): Promise<Page[]> {
    const m = ProjectManager.active();
    if (!m) return [];
    return (await m.readData('pages')) as Page[];
  },

  async save(pages: Page[]): Promise<void> {
    const m = ProjectManager.active();
    if (!m) throw new Error('No project open');
    await m.writeData('pages', pages);
  },

  async getById(id: string): Promise<Page | null> {
    const pages = await this.list();
    return pages.find((p) => p.id === id) ?? null;
  },

  async upsert(page: Page): Promise<void> {
    const pages = await this.list();
    const idx = pages.findIndex((p) => p.id === page.id);
    if (idx >= 0) {
      pages[idx] = page;
    } else {
      pages.push(page);
    }
    await this.save(pages);
  },

  async delete(id: string): Promise<void> {
    const pages = (await this.list()).filter((p) => p.id !== id);
    await this.save(pages);
    const m = ProjectManager.active();
    if (m) await m.deletePageLayers(id);
  },
};
