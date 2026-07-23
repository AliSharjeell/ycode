'use client';

/**
 * Welcome screen — shown when no project is open.
 *
 * Three actions: Open a project folder, Create a new project, or pick
 * a recent project. The list of recent projects is loaded from the main
 * process.
 */
import React from 'react';
import { useProjectStore } from '@/stores/useProjectStore';
import { Button } from '@/components/ui/button';

export function ProjectPicker(): React.ReactElement {
  const project = useProjectStore();

  React.useEffect(() => {
    void project.loadRecent();
  }, []);

  return (
    <div className="flex flex-col items-center justify-center h-full bg-background p-12">
      <div className="flex flex-col items-center gap-6 max-w-2xl w-full">
        <h1 className="text-3xl font-semibold">Ycode</h1>
        <p className="text-sm text-muted-foreground text-center">
          A visual website builder for your desktop. Open a project to start editing.
        </p>

        <div className="flex gap-3">
          <Button onClick={() => project.open()}>Open Project…</Button>
          <Button onClick={() => project.create()} variant="outline">
            Create New Project…
          </Button>
        </div>

        {project.recent.length > 0 && (
          <div className="w-full flex flex-col gap-2 mt-8">
            <div className="text-xs font-semibold text-muted-foreground">Recent</div>
            {project.recent.map((path) => (
              <button
                key={path}
                onClick={() => project.openPath(path)}
                className="text-left text-sm p-2 rounded hover:bg-muted border border-transparent hover:border-border"
              >
                <div className="font-mono truncate">{path}</div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
