/**
 * Page layers repository — file-backed.
 *
 * Each page's layer tree lives in data/layers/<pageId>.json. Page id is
 * stable, so files are stable too.
 */
import { ProjectManager } from '../project-manager';
import type { PageLayers } from '../../../types';

export const pageLayersRepository = {
  async getByPageId(pageId: string): Promise<PageLayers> {
    const m = ProjectManager.active();
    if (!m) throw new Error('No project open');
    return (await m.readPageLayers(pageId)) as PageLayers;
  },

  async save(pageId: string, payload: PageLayers): Promise<void> {
    const m = ProjectManager.active();
    if (!m) throw new Error('No project open');
    await m.writePageLayers(pageId, payload);
  },

  async delete(pageId: string): Promise<void> {
    const m = ProjectManager.active();
    if (!m) return;
    await m.deletePageLayers(pageId);
  },
};
