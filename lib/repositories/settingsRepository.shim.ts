/**
 * Settings shim — file-backed settings for the active project.
 */
import { isDesktop } from '@/lib/api';
import { settingsApi } from '@/lib/api';

export async function getSettingByKey(key: string): Promise<unknown | null> {
  if (!isDesktop()) return null;
  const settings = await settingsApi.get();
  return (settings as Record<string, unknown>)[key] ?? null;
}

export async function getSettingsByKeys(keys: string[]): Promise<Record<string, unknown>> {
  if (!isDesktop()) return {};
  const settings = await settingsApi.get();
  const out: Record<string, unknown> = {};
  for (const key of keys) {
    out[key] = (settings as Record<string, unknown>)[key] ?? null;
  }
  return out;
}
