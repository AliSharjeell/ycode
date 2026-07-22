/**
 * Pages shim.
 */
import { isDesktop, pagesApi } from '@/lib/api';

export async function getAllPages(): Promise<any[]> {
  if (!isDesktop()) return [];
  return pagesApi.list();
}
