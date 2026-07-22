# Ycode

A visual website builder for your desktop. Open a project folder, edit visually, build a static site, commit to git, and push to GitHub — all from one app.

## What changed

This used to be a hosted Next.js app with Postgres, Supabase, an AI agent, an MCP server, CMS collections, and ~30 third-party integrations. It is now a self-contained Electron desktop app that:

- Stores projects as plain folders on your filesystem.
- Tracks changes with git (built-in).
- Connects to GitHub via OAuth Device Flow (no PAT required).
- Generates a static site to `out/` for free hosting.

The CMS, AI agent, MCP, integrations, forms, multi-locale, and users/roles layers are gone. What stays is the visual editor: pages, layers, components, layer styles, assets, fonts, globals, color variables, and settings.

## Getting started

### Prerequisites

- Node.js 18+
- npm
- git (in your `$PATH`)

### Run in development

```bash
npm install
npm run dev
```

This starts the Next.js dev server on `http://localhost:3002` and then launches Electron, pointing at it.

### Build a release

```bash
npm run build
```

Produces:

- `out/` — the static Next.js renderer bundle.
- `release/Ycode Setup <version>.exe` (Windows), `Ycode-<version>.dmg` (macOS), `Ycode-<version>.AppImage` (Linux) — the Electron app.

## Project folder

A project is a folder on disk with this layout:

```
my-site/
├── .ycode/
│   ├── project.json          # metadata (id, name, createdAt, lastOpenedAt)
│   └── config.json           # local editor config (panel sizes, etc.)
├── data/
│   ├── pages.json            # list of pages
│   ├── layers/<pageId>.json  # one file per page's layer tree
│   ├── components.json
│   ├── layer-styles.json
│   ├── settings.json
│   ├── globals.json
│   ├── color-variables.json
│   ├── fonts.json
│   └── redirects.json
├── assets/
│   ├── images/
│   └── fonts/
└── out/                      # generated static site (gitignored by default)
```

When you click **Create New Project…** in the welcome screen, the `blank` template is copied into your chosen folder. You can add more templates under `templates/` and update `electron/ipc/project.ts` to expose them.

## Git

Git is built in. When you open a project, the **Git** panel in the sidebar shows working-tree status, history, and branches. To start tracking a project that isn't yet a repo, click **Initialize as Git Repository** in the Git panel.

The first time you commit, you'll be prompted to commit with an initial message. After that, every commit is a normal git commit.

Remote URLs are configured in the Git panel. Pushes use the GitHub OAuth Device Flow when you're connected, or fall back to your system git credentials.

## GitHub

The **GitHub** submenu in the **Git** panel drives the OAuth Device Flow:

1. Click **Connect GitHub**.
2. A short code appears on screen. Visit **`https://github.com/login/device`** and paste the code.
3. The app polls for confirmation. When you click **Authorize** on github.com, the app stores the token in your OS keychain (via Electron's `safeStorage`) and shows your username.

From there, you can:

- **List repos** to add as a remote.
- **Create new repo** to spin up a fresh GitHub repo and add it as `origin`.
- **Push / Pull / Fetch** directly from the Git panel.

The token is never sent to the renderer. The main process performs GitHub API calls on the renderer's behalf.

## Building a static site

The **Build Site** button (or `Ctrl+B`) generates a complete static site in `<project>/out/`. The site is plain HTML + CSS + JS — no server needed. Open `out/index.html` in any browser to preview locally, or upload `out/` to GitHub Pages, Netlify, Vercel, or any static host.

The build pipeline:

1. Reads every page in `data/pages.json`.
2. Resolves its layer tree from `data/layers/<pageId>.json`.
3. Renders the page to HTML using the same rendering rules as the in-editor preview.
4. Walks `assets/` and copies each file to `out/assets/` (content-hash deduplicated).
5. Aggregates CSS — layer styles, color variables, generated per-page CSS, custom fonts, project-published CSS — into `out/assets/site.css`.
6. Writes `out/assets/site.js` with the runtime (slider, lightbox, smooth-scroll, form post).
7. Writes `out/sitemap.xml` and `out/robots.txt`.

## Architecture

```
┌─ Electron main process (Node) ─────────────────────────────┐
│ • BrowserWindow lifecycle                                   │
│ • File system (project manager, atomic file writes)         │
│ • Git (isomorphic-git + system git fallback)                │
│ • GitHub OAuth Device Flow + safeStorage token              │
│ • Static site generator (lib/static-export)                 │
│ • Native menu, dialogs, IPC handlers, custom protocols      │
└─────────────────┬───────────────────────────────────────────┘
                  │ contextBridge (window.api)
┌─────────────────▼───────────────────────────────────────────┐
│ Renderer (Next.js static export, single window)             │
│ • Three-panel editor (YCodeBuilderMain)                     │
│ • Pages tree, layers tree, canvas, right panel              │
│ • Git panel, GitHub connect dialog, project picker          │
│ • Stores: useProjectStore, useGitStore, useGitHubStore      │
└─────────────────────────────────────────────────────────────┘
```

The renderer is a static export — no SSR, no API routes. It talks to the main process exclusively via `window.api`, which is exposed in `electron/preload.ts` and wraps `ipcRenderer.invoke`.

### Key directories

| Path | Purpose |
|---|---|
| `electron/` | Main process (TypeScript, compiled to `dist/electron/`) |
| `electron/main.ts` | Window creation, app lifecycle, protocol registration |
| `electron/preload.ts` | `contextBridge` IPC surface |
| `electron/ipc/*.ts` | Per-domain IPC handlers (project, git, github, builder) |
| `electron/menu.ts` | Native application menu |
| `lib/projects/` | Project manager, file-based repositories |
| `lib/git/` | Git operations via isomorphic-git |
| `lib/github/` | OAuth Device Flow + REST API client |
| `lib/static-export/` | Pure-function HTML/CSS/JS generator |
| `lib/api.ts` | Renderer-side wrapper around `window.api` |
| `stores/useProjectStore.ts` | Current project state |
| `stores/useGitStore.ts` | Git status, log, branches |
| `stores/useGitHubStore.ts` | GitHub connection state |
| `app/(builder)/ycode/components/ProjectPicker.tsx` | Welcome screen |
| `app/(builder)/ycode/components/GitPanel.tsx` | Git status / history / branches |
| `app/(builder)/ycode/components/GitHubConnectDialog.tsx` | Device Flow UX |
| `templates/blank/` | Default starter template |

## Custom protocols

Two custom URLs let the renderer reference files in the active project without using `file://`:

- `ycode-asset://<projectHash>/<relative-path>` — files under `assets/`.
- `ycode-project://<projectHash>/<relative-path>` — files under `data/`.

The `<projectHash>` is a SHA-1 of the project path, so multiple open projects can coexist without conflicts.

## Migration status

The visual editor (`YCodeBuilderMain`, `LayerRenderer`, `Canvas`, `PagesTree`, `LayersTree`, `ComponentInstanceSidebar`, etc.) is the original Ycode code with broken imports from the old Postgres/Supabase stack. Their behaviour is correct; their imports need to be migrated to the new IPC API in `lib/api.ts`.

`lib/repositories/*` now re-exports a thin shim that returns empty data for the removed domains (CMS, locales, translations, versions) and delegates to the file-system project model for the rest. This is enough to launch the editor shell and see pages, layers, and components — but the features that depend on the shimmed modules (CMS view, locale switcher, redirects editor) will not work.

To migrate the editor end-to-end, switch each `lib/api.ts` consumer to the new IPC-based surface and remove the shim files. The component-level migrations are tracked in `app/(builder)/ycode/components/`.

## License

MIT.
