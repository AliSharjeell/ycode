/**
 * Asset repository shim — file-backed.
 *
 * Reads from the active project's assets/ folder via the filesMetadata
 * stored at data/assets.json. The legacy editor code calls these
 * functions; we keep them working but back them with the file system.
 */
import { isDesktop } from '@/lib/api';

export interface Asset {
  id: string;
  filename: string;
  category: string;
  mime_type: string;
  size: number;
  url: string;
  folder_id: string | null;
  alt: string | null;
}

export async function getAssetsByIds(
  ids: string[],
  _draft: boolean = false,
): Promise<Record<string, Asset>> {
  if (!isDesktop() || ids.length === 0) return {};
  // Read assets.json from the active project.
  const assets = (await window.api!.project.readData('assets')) as Asset[];
  const out: Record<string, Asset> = {};
  for (const asset of assets) {
    if (ids.includes(asset.id)) {
      out[asset.id] = asset;
    }
  }
  return out;
}

export async function getAllAssets(_draft: boolean = false): Promise<Asset[]> {
  if (!isDesktop()) return [];
  return (await window.api!.project.readData('assets')) as Asset[];
}

export async function getAssetsByFolderId(folderId: string): Promise<Asset[]> {
  if (!isDesktop()) return [];
  const assets = (await window.api!.project.readData('assets')) as Asset[];
  return assets.filter((a) => a.folder_id === folderId);
}
