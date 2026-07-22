/**
 * Redirects repository — file-backed.
 */
import { ProjectManager } from '../project-manager';

export interface Redirect {
  id: string;
  from: string;
  to: string;
  code: 301 | 302;
}

export const redirectsRepository = {
  async list(): Promise<Redirect[]> {
    const m = ProjectManager.active();
    if (!m) return [];
    return (await m.readData('redirects')) as Redirect[];
  },

  async save(redirects: Redirect[]): Promise<void> {
    const m = ProjectManager.active();
    if (!m) throw new Error('No project open');
    await m.writeData('redirects', redirects);
  },

  async upsert(redirect: Redirect): Promise<void> {
    const list = await this.list();
    const idx = list.findIndex((r) => r.id === redirect.id);
    if (idx >= 0) list[idx] = redirect;
    else list.push(redirect);
    await this.save(list);
  },

  async delete(id: string): Promise<void> {
    const list = (await this.list()).filter((r) => r.id !== id);
    await this.save(list);
  },
};
