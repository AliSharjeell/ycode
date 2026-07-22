/**
 * Font repository shim — file-backed.
 */
import { fontsApi } from '@/lib/api';

export async function getAllDraftFonts(): Promise<any[]> {
  return fontsApi.list();
}

export async function getPublishedFonts(): Promise<any[]> {
  return fontsApi.list();
}
