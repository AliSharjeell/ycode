/**
 * Server-side page renderer.
 *
 * Takes page metadata + the layer tree + components + settings and returns
 * a complete HTML document. Mirrors the layout produced by the old
 * `PageRenderer` component, but plain HTML strings — no React tree.
 */
type Layer = Record<string, any>;
type Page = Record<string, any>;
type PageLayers = Record<string, any>;

interface RenderOptions {
  page: Page;
  pageLayers: PageLayers;
  components: any[];
  settings: any;
  globals: any[];
  colorVariables: any[];
  fonts: any[];
  layerStyles: any[];
}

export async function renderPage(opts: RenderOptions): Promise<string> {
  const { page, pageLayers, settings, colorVariables } = opts;
  const layers = (pageLayers.layers ?? []) as Layer[];
  const customHead = settings.customHeadCode ?? '';
  const customBody = settings.customBodyCode ?? '';
  const siteName = settings.siteName ?? 'My Site';
  const favicon = settings.favicon ?? '';

  const cssVariables = (colorVariables as Array<{ key: string; value: string }>)
    .map((cv) => `  --${cv.key}: ${cv.value};`)
    .join('\n');

  const body = renderLayers(layers, opts);

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${escapeHtml(page.name ?? siteName)}</title>
${favicon ? `<link rel="icon" href="${escapeHtml(favicon)}" />` : ''}
<link rel="stylesheet" href="/assets/site.css" />
<style>
:root {
${cssVariables}
}
</style>
${customHead}
</head>
<body>
${body}
${customBody}
<script src="/assets/site.js" defer></script>
</body>
</html>`;
}

function renderLayers(layers: Layer[], opts: RenderOptions): string {
  return layers.map((layer) => renderLayer(layer, opts)).join('\n');
}

function renderLayer(layer: Layer, opts: RenderOptions): string {
  if (!layer || layer.hidden) return '';
  const name = layer.name as string;
  const children = (layer.children as Layer[]) ?? [];
  const tag = getTag(name);
  const classes = resolveClasses(layer, opts);
  const attrs = renderAttributes(layer);
  const inner = renderLayers(children, opts);
  const selfClose = isSelfClosing(tag);
  if (selfClose) {
    return `<${tag} class="${escapeHtml(classes)}"${attrs} />`;
  }
  return `<${tag} class="${escapeHtml(classes)}"${attrs}>${inner}</${tag}>`;
}

function getTag(name: string): string {
  // Map layer.name to HTML tag. The editor uses a rich set of element names
  // (Div, Section, H1, Span, Image, etc.); we map to the canonical HTML.
  const map: Record<string, string> = {
    Div: 'div',
    Section: 'section',
    Article: 'article',
    Header: 'header',
    Footer: 'footer',
    Main: 'main',
    Aside: 'aside',
    Nav: 'nav',
    H1: 'h1',
    H2: 'h2',
    H3: 'h3',
    H4: 'h4',
    H5: 'h5',
    H6: 'h6',
    P: 'p',
    Span: 'span',
    A: 'a',
    Button: 'button',
    Image: 'img',
    Img: 'img',
    Video: 'video',
    Audio: 'audio',
    Source: 'source',
    Iframe: 'iframe',
    Form: 'form',
    Input: 'input',
    TextArea: 'textarea',
    Select: 'select',
    Label: 'label',
    Ul: 'ul',
    Ol: 'ol',
    Li: 'li',
    Table: 'table',
    THead: 'thead',
    TBody: 'tbody',
    Tr: 'tr',
    Th: 'th',
    Td: 'td',
    Hr: 'hr',
    Br: 'br',
  };
  return map[name] ?? 'div';
}

function isSelfClosing(tag: string): boolean {
  return ['img', 'br', 'hr', 'source', 'input', 'meta', 'link'].includes(tag);
}

function renderAttributes(layer: Layer): string {
  const settings = (layer.settings ?? {}) as Record<string, any>;
  const attributes = (layer.attributes ?? {}) as Record<string, any>;
  const parts: string[] = [];

  // id
  if (attributes.id) parts.push(`id="${escapeHtml(String(attributes.id))}"`);
  // href (anchor)
  if (settings.href) parts.push(`href="${escapeHtml(String(settings.href))}"`);
  // src (img/video/audio/source)
  if (settings.src) parts.push(`src="${escapeHtml(String(settings.src))}"`);
  // alt (img)
  if (settings.alt) parts.push(`alt="${escapeHtml(String(settings.alt))}"`);
  // image / icon
  if (layer.image?.src) {
    parts.push(`src="${escapeHtml(String(layer.image.src))}"`);
    if (layer.image.alt) parts.push(`alt="${escapeHtml(String(layer.image.alt))}"`);
  }
  // background image
  if (layer.design?.backgrounds?.image?.src) {
    // rendered as inline style — class-based version is separate
  }
  // data-* passthrough
  for (const [key, value] of Object.entries(attributes)) {
    if (['id', 'href', 'src', 'alt'].includes(key)) continue;
    if (key.startsWith('data-')) {
      parts.push(`${key}="${escapeHtml(String(value))}"`);
    }
  }

  // inline style for design properties we don't expand to Tailwind
  const inline = inlineStyle(layer);
  if (inline) parts.push(`style="${escapeHtml(inline)}"`);

  return parts.length > 0 ? ' ' + parts.join(' ') : '';
}

function resolveClasses(layer: Layer, opts: RenderOptions): string {
  const base = (layer.classes as string) ?? '';
  // Apply styleIds (style chips)
  const styleIds = (layer.styleIds as string[]) ?? [];
  const styleClasses = (opts.layerStyles as Array<{ id: string; classes: string }>)
    .filter((s) => styleIds.includes(s.id))
    .map((s) => s.classes)
    .join(' ');
  return [base, styleClasses].filter(Boolean).join(' ').trim();
}

function inlineStyle(layer: Layer): string {
  const design = (layer.design ?? {}) as Record<string, any>;
  const parts: string[] = [];
  // Background image
  if (design.backgrounds?.image?.src) {
    parts.push(`background-image: url(${JSON.stringify(design.backgrounds.image.src)})`);
  }
  if (design.backgrounds?.image?.size) {
    parts.push(`background-size: ${design.backgrounds.image.size}`);
  }
  if (design.backgrounds?.image?.position) {
    parts.push(`background-position: ${design.backgrounds.image.position}`);
  }
  if (design.backgrounds?.image?.repeat) {
    parts.push(`background-repeat: ${design.backgrounds.image.repeat}`);
  }
  return parts.join('; ');
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
