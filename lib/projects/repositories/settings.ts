/**
 * Settings repository — file-backed.
 *
 * Settings is a single key/value JSON object: data/settings.json.
 */
import { ProjectManager } from '../project-manager';

export interface Settings {
  siteName?: string;
  favicon?: string;
  timezone?: string;
  customHeadCode?: string;
  customBodyCode?: string;
  sitemapEnabled?: boolean;
  [key: string]: unknown;
}

export const settingsRepository = {
  async get(): Promise<Settings> {
    const m = ProjectManager.active();
    if (!m) return {};
    return (await m.readData('settings')) as Settings;
  },

  async save(settings: Settings): Promise<void> {
    const m = ProjectManager.active();
    if (!m) throw new Error('No project open');
    await m.writeData('settings', settings);
  },

  async patch(partial: Partial<Settings>): Promise<Settings> {
    const current = await this.get();
    const next = { ...current, ...partial };
    await this.save(next);
    return next;
  },
};
