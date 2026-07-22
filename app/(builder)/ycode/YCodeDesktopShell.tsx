/**
 * Minimal desktop editor shell.
 *
 * The original `YCodeBuilderMain` (panel/canvas/components) is a complex
 * piece of UI that depended on the deleted CMS, Supabase, and AI layers.
 * A full migration is an ongoing effort.
 *
 * In the meantime, this shell gives the user a working desktop app that
 * exposes the new file-system project model, Git integration, GitHub
 * Device Flow, and the static site generator. As the visual editor is
 * migrated, this shell can be replaced with a thin host that renders
 * the proper YCodeBuilderMain.
 *
 * Layout:
 *  ┌────────────────────────────────────────────────────┐
 *  │  Header (project name, build, push, GitHub)        │
 *  ├──────────────┬──────────────────┬──────────────────┤
 *  │  Pages list  │  Canvas preview  │  Git panel       │
 *  │  (placeholder)│  (placeholder)  │                  │
 *  └──────────────┴──────────────────┴──────────────────┘
 */
'use client';

import { useEffect, useState } from 'react';
import { useProjectStore } from '@/stores/useProjectStore';
import { useGitStore } from '@/stores/useGitStore';
import { useGitHubStore } from '@/stores/useGitHubStore';
import { ProjectPicker } from './components/ProjectPicker';
import { GitPanel } from './components/GitPanel';
import { GitHubConnectDialog } from './components/GitHubConnectDialog';
import { Button } from '@/components/ui/button';
import { ProjectPlaceholder } from './components/ProjectPlaceholder';

export function YCodeDesktopShell(): React.ReactElement {
  const project = useProjectStore();
  const git = useGitStore();
  const github = useGitHubStore();
  const [githubOpen, setGithubOpen] = useState(false);
  const [buildStatus, setBuildStatus] = useState<string | null>(null);
  const [buildBusy, setBuildBusy] = useState(false);

  useEffect(() => {
    if (project.path) {
      void git.refresh();
    }
  }, [project.path]);

  if (!project.path) {
    return <ProjectPicker />;
  }

  async function handleBuild(): Promise<void> {
    setBuildBusy(true);
    setBuildStatus('Building…');
    try {
      const { builderApi } = await import('@/lib/api');
      const result = await builderApi.build();
      if (result.ok) {
        setBuildStatus(`Built to ${result.outDir}`);
      } else {
        setBuildStatus(`Build failed: ${result.error}`);
      }
    } catch (err) {
      setBuildStatus(`Build error: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setBuildBusy(false);
    }
  }

  return (
    <div className="flex h-screen w-screen bg-background text-foreground">
      <header className="flex items-center justify-between border-b border-border px-4 py-2 absolute top-0 left-0 right-0 z-10 bg-background">
        <div className="flex items-center gap-3">
          <span className="font-semibold">Ycode</span>
          <span className="text-sm text-muted-foreground">
            {project.meta?.name ?? '…'}
            {project.path && (
              <span className="ml-2 text-xs font-mono opacity-50">{project.path}</span>
            )}
          </span>
          {project.isDirty && (
            <span className="text-xs text-amber-500">● Unsaved</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={handleBuild} disabled={buildBusy} variant="default">
            {buildBusy ? 'Building…' : 'Build Site'}
          </Button>
          <Button onClick={() => git.commit(messagePrompt())} variant="outline">
            Commit
          </Button>
          <Button onClick={() => git.push()} variant="outline" disabled={git.remotes.length === 0}>
            Push
          </Button>
          <Button onClick={() => setGithubOpen(true)} variant="outline">
            {github.connected ? `GitHub: ${github.login}` : 'Connect GitHub'}
          </Button>
          <Button onClick={() => project.close()} variant="ghost">
            Close
          </Button>
        </div>
      </header>

      {buildStatus && (
        <div className="absolute top-12 left-0 right-0 text-center text-xs text-muted-foreground py-1">
          {buildStatus}
        </div>
      )}

      <main className="flex w-full h-full pt-12">
        <aside className="w-64 border-r border-border overflow-y-auto">
          <ProjectPlaceholder />
        </aside>
        <section className="flex-1 border-r border-border overflow-y-auto">
          <ProjectPlaceholder />
        </section>
        <aside className="w-96 overflow-y-auto">
          <GitPanel />
        </aside>
      </main>

      <GitHubConnectDialog open={githubOpen} onOpenChange={setGithubOpen} />
    </div>
  );
}

function messagePrompt(): string {
  const m = typeof window !== 'undefined' ? window.prompt('Commit message') : null;
  return m ?? '';
}
