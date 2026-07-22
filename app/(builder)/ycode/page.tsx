/**
 * Base route for the Ycode editor — URL: /ycode.
 *
 * Hosts the desktop shell. The original YCodeBuilderMain is not rendered
 * here because it depends on the legacy editor code that has not yet
 * been migrated to the new IPC API. As components are migrated, this
 * shell can be replaced with a thin wrapper around the migrated
 * YCodeBuilderMain.
 */
'use client';

import { useEffect } from 'react';
import { useProjectStore } from '@/stores/useProjectStore';
import { YCodeDesktopShell } from './YCodeDesktopShell';
import { isDesktop } from '@/lib/api';

export default function YCodeEditorRoute() {
  const project = useProjectStore();

  useEffect(() => {
    if (isDesktop()) {
      void project.refresh();
    }
  }, []);

  if (!isDesktop()) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background text-foreground">
        <div className="text-center p-8 max-w-md">
          <h1 className="text-2xl font-semibold mb-2">Ycode desktop</h1>
          <p className="text-sm text-muted-foreground">
            This is the desktop editor. Run <code className="font-mono">npm run dev</code>{' '}
            to launch the Electron host, or open the static export from
            <code className="font-mono"> out/index.html </code>
            in a browser.
          </p>
        </div>
      </div>
    );
  }

  return <YCodeDesktopShell />;
}
