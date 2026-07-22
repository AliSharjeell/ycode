/**
 * Font repository shim — file-backed.
 */
import { isDesktop, fontsApi } from '@/lib/api';

export interface Font {
  id: string;
  family: string;
  src?: string;
  weights?: number[];
  is_google_font?: boolean;
}

export async function getAllDraftFonts(): Promise<Font[]> {
  if (!isDesktop()) return [];
  return fontsApi.list();
}

export async function getPublishedFonts(): Promise<Font[]> {
  if (!isDesktop()) return [];
  return fontsApi.list();
}
