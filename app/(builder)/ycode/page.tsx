/**
 * Base route for the Ycode editor — URL: /ycode.
 *
 * Shows the ProjectPicker when no project is open; otherwise the editor
 * shell (rendered by the layout) takes over.
 */
'use client';

import { useEffect } from 'react';
import { useProjectStore } from '@/stores/useProjectStore';
import { ProjectPicker } from './components/ProjectPicker';
import { isDesktop } from '@/lib/api';

export default function YCodeEditorRoute() {
  const project = useProjectStore();

  useEffect(() => {
    if (!isDesktop()) {
      // When running in a plain browser (e.g. during next dev outside
      // Electron), we still try to load from the URL hash as a dev escape
      // hatch. The renderer uses file:// URLs in dev to talk to a
      // stand-alone project folder.
      return;
    }
    void project.refresh();
  }, []);

  if (isDesktop() && !project.path) {
    return <ProjectPicker />;
  }

  // The actual editor shell is rendered by the layout (YCodeBuilderMain).
  return null;
}
