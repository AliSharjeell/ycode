'use client';

/**
 * Placeholder for the visual editor side-panel / canvas.
 *
 * The original editor chrome (LayersTree, Canvas, PagesTree, etc.) is
 * still being migrated to the new IPC API. Until that work is done,
 * this placeholder lets the user exercise the new desktop features
 * (project lifecycle, Git, GitHub, static export) without depending
 * on the legacy editor code.
 */
import React from 'react';

export function ProjectPlaceholder(): React.ReactElement {
  return (
    <div className="flex flex-col items-center justify-center h-full p-8 text-center">
      <h2 className="text-sm font-semibold mb-2">Visual editor</h2>
      <p className="text-xs text-muted-foreground max-w-md">
        The visual editor is currently being migrated to the new desktop
        API. Until that work is complete, use the buttons in the header
        to build your site, commit changes, and push to GitHub.
      </p>
      <p className="text-xs text-muted-foreground mt-4">
        Your project data lives in JSON files under <code className="font-mono">data/</code> in
        the project folder. You can edit them directly while we rebuild the UI.
      </p>
    </div>
  );
}
