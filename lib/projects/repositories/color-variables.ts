/**
 * Color variables repository — file-backed.
 */
import { ProjectManager } from '../project-manager';
import type { ColorVariable } from '../../../types';

export const colorVariablesRepository = {
  async list(): Promise<ColorVariable[]> {
    const m = ProjectManager.active();
    if (!m) return [];
    return (await m.readData('color-variables')) as ColorVariable[];
  },

  async save(vars: ColorVariable[]): Promise<void> {
    const m = ProjectManager.active();
    if (!m) throw new Error('No project open');
    await m.writeData('color-variables', vars);
  },

  async upsert(v: ColorVariable): Promise<void> {
    const list = await this.list();
    const idx = list.findIndex((c) => c.id === v.id);
    if (idx >= 0) list[idx] = v;
    else list.push(v);
    await this.save(list);
  },

  async delete(id: string): Promise<void> {
    const list = (await this.list()).filter((c) => c.id !== id);
    await this.save(list);
  },
};
