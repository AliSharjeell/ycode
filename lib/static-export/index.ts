/**
 * Static site generator entry point.
 *
 * Walks the project's data/, renders every page to HTML, and writes the
 * result to <project>/out/. Progress is streamed via the optional callback
 * so the UI can show a progress bar.
 */
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { renderPage } from './render-page';
import { collectCss } from './css';
import { collectAssets } from './assets';
import { collectJs } from './js';

interface Progress {
  stage: string;
  percent: number;
  message?: string;
}

export async function buildSite(
  projectPath: string,
  onProgress?: (p: Progress) => void,
): Promise<string> {
  const outDir = path.join(projectPath, 'out');
  await fs.rm(outDir, { recursive: true, force: true });
  await fs.mkdir(outDir, { recursive: true });
  await fs.mkdir(path.join(outDir, 'assets'), { recursive: true });

  const emit = (p: Progress) => onProgress?.(p);

  emit({ stage: 'reading', percent: 0, message: 'Reading project data' });
  const data = await readProjectData(projectPath);
  emit({ stage: 'reading', percent: 10, message: `Found ${data.pages.length} pages` });

  const pages = data.pages.filter((p) => p.is_index || p.slug);
  const total = pages.length;
  let done = 0;

  for (const page of pages) {
    done += 1;
    const pageLayers = data.layersByPage[page.id] ?? { id: page.id, page_id: page.id, layers: [] };
    const html = await renderPage({
      page,
      pageLayers,
      components: data.components,
      settings: data.settings,
      globals: data.globals,
      colorVariables: data.colorVariables,
      fonts: data.fonts,
      layerStyles: data.layerStyles,
    });
    const slug = page.is_index ? 'index' : page.slug;
    const target = path.join(outDir, slug === 'index' ? 'index.html' : path.join(slug, 'index.html'));
    await fs.mkdir(path.dirname(target), { recursive: true });
    await fs.writeFile(target, html, 'utf8');
    emit({
      stage: 'rendering',
      percent: 10 + Math.round((done / total) * 60),
      message: `Rendered ${page.name} (${done}/${total})`,
    });
  }

  emit({ stage: 'css', percent: 75, message: 'Collecting CSS' });
  const css = await collectCss(projectPath, data);
  await fs.writeFile(path.join(outDir, 'assets', 'site.css'), css, 'utf8');

  emit({ stage: 'js', percent: 85, message: 'Collecting JS' });
  const js = await collectJs(projectPath);
  await fs.writeFile(path.join(outDir, 'assets', 'site.js'), js, 'utf8');

  emit({ stage: 'assets', percent: 92, message: 'Copying assets' });
  const copied = await collectAssets(projectPath, outDir);
  emit({ stage: 'assets', percent: 95, message: `Copied ${copied} files` });

  emit({ stage: 'sitemap', percent: 97, message: 'Writing sitemap' });
  const sitemap = generateSitemap(pages, data.settings);
  await fs.writeFile(path.join(outDir, 'sitemap.xml'), sitemap, 'utf8');

  const robots = `User-agent: *\nAllow: /\n`;
  await fs.writeFile(path.join(outDir, 'robots.txt'), robots, 'utf8');

  // Placeholder for output to survive .gitignore.
  await fs.writeFile(path.join(outDir, '.gitkeep'), '', 'utf8');

  emit({ stage: 'done', percent: 100, message: 'Build complete' });
  return outDir;
}

async function readProjectData(projectPath: string): Promise<{
  pages: any[];
  layersByPage: Record<string, any>;
  components: any[];
  settings: any;
  globals: any[];
  colorVariables: any[];
  fonts: any[];
  layerStyles: any[];
}> {
  const dataDir = path.join(projectPath, 'data');
  const pages = await readJson(path.join(dataDir, 'pages.json'), []);
  const components = await readJson(path.join(dataDir, 'components.json'), []);
  const settings = await readJson(path.join(dataDir, 'settings.json'), {});
  const globals = await readJson(path.join(dataDir, 'globals.json'), []);
  const colorVariables = await readJson(path.join(dataDir, 'color-variables.json'), []);
  const fonts = await readJson(path.join(dataDir, 'fonts.json'), []);
  const layerStyles = await readJson(path.join(dataDir, 'layer-styles.json'), []);

  const layersByPage: Record<string, any> = {};
  const layersDir = path.join(dataDir, 'layers');
  try {
    const files = await fs.readdir(layersDir);
    for (const file of files) {
      if (!file.endsWith('.json')) continue;
      const pageId = file.replace(/\.json$/, '');
      const raw = await fs.readFile(path.join(layersDir, file), 'utf8');
      layersByPage[pageId] = JSON.parse(raw);
    }
  } catch {
    // no layers dir
  }

  return {
    pages,
    layersByPage,
    components,
    settings,
    globals,
    colorVariables,
    fonts,
    layerStyles,
  };
}

async function readJson<T>(file: string, fallback: T): Promise<T> {
  try {
    const raw = await fs.readFile(file, 'utf8');
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function generateSitemap(pages: any[], settings: any): string {
  const host = (settings.siteUrl as string) ?? 'https://example.com';
  const urls = pages
    .filter((p) => p.is_index || p.slug)
    .map((p) => {
      const slug = p.is_index ? '' : `/${p.slug}`;
      return `  <url>\n    <loc>${host}${slug}</loc>\n  </url>`;
    })
    .join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
}
