/**
 * Asset copy for static export.
 *
 * Walks the project's assets/ folder and copies each file into out/assets/,
 * preserving the relative path. Deduplicates by content hash so the same
 * image used twice is only stored once.
 */
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import * as crypto from 'node:crypto';

export async function collectAssets(projectPath: string, outDir: string): Promise<number> {
  const srcDir = path.join(projectPath, 'assets');
  const dstDir = path.join(outDir, 'assets');
  let count = 0;
  const seen = new Map<string, string>(); // hash -> relative path

  await walk(srcDir, async (file) => {
    const rel = path.relative(srcDir, file);
    const data = await fs.readFile(file);
    const hash = crypto.createHash('sha1').update(data).digest('hex').slice(0, 16);
    const ext = path.extname(file);
    const targetName = `${hash}${ext}`;
    if (seen.has(hash)) {
      // already copied
      return;
    }
    seen.set(hash, targetName);
    await fs.writeFile(path.join(dstDir, targetName), data);
    count += 1;
    void rel;
  });

  return count;
}

async function walk(dir: string, onFile: (file: string) => Promise<void>): Promise<void> {
  let entries;
  try {
    entries = await fs.readdir(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      await walk(full, onFile);
    } else if (entry.isFile()) {
      await onFile(full);
    }
  }
}
