/**
 * Global variables repository — file-backed.
 */
import { ProjectManager } from '../project-manager';
import type { GlobalVariable } from '../../../types';

export const globalsRepository = {
  async list(): Promise<GlobalVariable[]> {
    const m = ProjectManager.active();
    if (!m) return [];
    return (await m.readData('globals')) as GlobalVariable[];
  },

  async save(globals: GlobalVariable[]): Promise<void> {
    const m = ProjectManager.active();
    if (!m) throw new Error('No project open');
    await m.writeData('globals', globals);
  },

  async upsert(v: GlobalVariable): Promise<void> {
    const list = await this.list();
    const idx = list.findIndex((g) => g.id === v.id);
    if (idx >= 0) list[idx] = v;
    else list.push(v);
    await this.save(list);
  },

  async delete(id: string): Promise<void> {
    const list = (await this.list()).filter((g) => g.id !== id);
    await this.save(list);
  },
};
