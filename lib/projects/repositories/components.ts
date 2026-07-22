/**
 * Components repository — file-backed.
 *
 * Components are reusable layer trees. Stored in data/components.json.
 */
import { ProjectManager } from '../project-manager';
import type { Component } from '../../../types';

export const componentsRepository = {
  async list(): Promise<Component[]> {
    const m = ProjectManager.active();
    if (!m) return [];
    return (await m.readData('components')) as Component[];
  },

  async save(components: Component[]): Promise<void> {
    const m = ProjectManager.active();
    if (!m) throw new Error('No project open');
    await m.writeData('components', components);
  },

  async getById(id: string): Promise<Component | null> {
    const list = await this.list();
    return list.find((c) => c.id === id) ?? null;
  },

  async upsert(component: Component): Promise<void> {
    const list = await this.list();
    const idx = list.findIndex((c) => c.id === component.id);
    if (idx >= 0) list[idx] = component;
    else list.push(component);
    await this.save(list);
  },

  async delete(id: string): Promise<void> {
    const list = (await this.list()).filter((c) => c.id !== id);
    await this.save(list);
  },
};
