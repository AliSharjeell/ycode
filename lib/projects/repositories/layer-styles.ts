/**
 * Layer styles repository — file-backed.
 */
import { ProjectManager } from '../project-manager';
import type { LayerStyle } from '../../../types';

export const layerStylesRepository = {
  async list(): Promise<LayerStyle[]> {
    const m = ProjectManager.active();
    if (!m) return [];
    return (await m.readData('layer-styles')) as LayerStyle[];
  },

  async save(styles: LayerStyle[]): Promise<void> {
    const m = ProjectManager.active();
    if (!m) throw new Error('No project open');
    await m.writeData('layer-styles', styles);
  },

  async upsert(style: LayerStyle): Promise<void> {
    const list = await this.list();
    const idx = list.findIndex((s) => s.id === style.id);
    if (idx >= 0) list[idx] = style;
    else list.push(style);
    await this.save(list);
  },

  async delete(id: string): Promise<void> {
    const list = (await this.list()).filter((s) => s.id !== id);
    await this.save(list);
  },
};
