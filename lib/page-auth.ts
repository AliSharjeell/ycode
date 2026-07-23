/**
 * @deprecated Stub for the deleted page-auth (cookie-based page
 * password protection) module. The desktop app does not currently
 * expose password-protected pages; the static site generator emits
 * the page as-is.
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
export const PAGE_AUTH_COOKIE = 'ycode_page_auth';

export function parseAuthCookie(_value?: string): any {
  return null;
}

export function getPasswordProtection(_page: any, _folders: any, _cookie: any): {
  isProtected: boolean;
  isUnlocked: boolean;
  protectedBy: 'page' | 'folder' | null;
  protectedById: string | null;
} {
  return { isProtected: false, isUnlocked: true, protectedBy: null, protectedById: null };
}

export function fetchFoldersForAuth(_draft: boolean = false): Promise<any[]> {
  return Promise.resolve([]);
}
