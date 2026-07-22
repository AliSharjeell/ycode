/**
 * Fonts repository — file-backed.
 */
import { ProjectManager } from '../project-manager';
import type { Font } from '../../../types';

export const fontsRepository = {
  async list(): Promise<Font[]> {
    const m = ProjectManager.active();
    if (!m) return [];
    return (await m.readData('fonts')) as Font[];
  },

  async save(fonts: Font[]): Promise<void> {
    const m = ProjectManager.active();
    if (!m) throw new Error('No project open');
    await m.writeData('fonts', fonts);
  },

  async upsert(font: Font): Promise<void> {
    const list = await this.list();
    const idx = list.findIndex((f) => f.id === font.id);
    if (idx >= 0) list[idx] = font;
    else list.push(font);
    await this.save(list);
  },

  async delete(id: string): Promise<void> {
    const list = (await this.list()).filter((f) => f.id !== id);
    await this.save(list);
  },
};
