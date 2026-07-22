/**
 * CSS aggregation for the static site.
 *
 * Combines: layer styles + color variables + inline design CSS + custom
 * fonts + animations. The result is a single site.css that the browser
 * loads once via a <link rel="stylesheet">.
 */
import * as fs from 'node:fs/promises';
import * as path from 'node:path';

interface BuildData {
  pages: any[];
  components: any[];
  settings: any;
  globals: any[];
  colorVariables: any[];
  fonts: any[];
  layerStyles: any[];
}

export async function collectCss(projectPath: string, data: BuildData): Promise<string> {
  const chunks: string[] = [];

  // 1. Layer styles
  for (const style of data.layerStyles as Array<{ id: string; classes: string; design?: any }>) {
    if (style.classes) {
      chunks.push(`/* layer style: ${style.id} */`);
      chunks.push(`.${style.id} { /* placeholder; rule emitted by editor */ }`);
    }
  }

  // 2. Color variables (already inlined in <style> on each page, but also
  //    exported here so JS can read them).
  chunks.push(':root {');
  for (const cv of data.colorVariables as Array<{ key: string; value: string }>) {
    chunks.push(`  --${cv.key}: ${cv.value};`);
  }
  chunks.push('}');

  // 3. Generated CSS from page_layers (one per page).
  const layersDir = path.join(projectPath, 'data', 'layers');
  try {
    const files = await fs.readdir(layersDir);
    for (const file of files) {
      if (!file.endsWith('.json')) continue;
      const raw = await fs.readFile(path.join(layersDir, file), 'utf8');
      const parsed = JSON.parse(raw);
      if (parsed.generated_css) {
        chunks.push(`/* page ${file} */`);
        chunks.push(parsed.generated_css);
      }
    }
  } catch {
    // no layers dir
  }

  // 4. Custom fonts
  for (const font of data.fonts as Array<{ family: string; src?: string; weights?: number[] }>) {
    if (font.src) {
      chunks.push(`@font-face { font-family: '${font.family}'; src: url('${font.src}'); }`);
    }
  }

  // 5. Project-published CSS
  const published = data.settings?.published_css;
  if (typeof published === 'string' && published.length > 0) {
    chunks.push('/* project-published CSS */');
    chunks.push(published);
  }

  return chunks.join('\n\n');
}
