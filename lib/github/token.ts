/**
 * Token storage — encrypted by Electron's safeStorage when available,
 * otherwise a plain file in userData.
 *
 * The token is only ever read in the main process. The renderer asks the
 * main process to perform GitHub API calls; it never sees the token.
 */
import * as fs from 'node:fs/promises';
import { safeStorage } from 'electron';

export class TokenStore {
  constructor(private readonly filePath: string) {}

  async save(token: string): Promise<void> {
    const payload = JSON.stringify({ access_token: token, saved_at: new Date().toISOString() });
    if (safeStorage.isEncryptionAvailable()) {
      const encrypted = safeStorage.encryptString(payload);
      await fs.writeFile(this.filePath, encrypted);
    } else {
      await fs.writeFile(this.filePath, payload, 'utf8');
    }
  }

  async load(): Promise<string | null> {
    try {
      const buffer = await fs.readFile(this.filePath);
      const payload = safeStorage.isEncryptionAvailable()
        ? safeStorage.decryptString(buffer)
        : buffer.toString('utf8');
      const parsed = JSON.parse(payload);
      return parsed.access_token ?? null;
    } catch {
      return null;
    }
  }

  async clear(): Promise<void> {
    try {
      await fs.unlink(this.filePath);
    } catch {
      // already gone
    }
  }
}
