'use client';

import React, { useEffect, useState } from 'react';
import { useGitStore } from '@/stores/useGitStore';
import { useGitHubStore } from '@/stores/useGitHubStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

type Tab = 'status' | 'history' | 'branches';

export function GitPanel(): React.ReactElement {
  const git = useGitStore();
  const github = useGitHubStore();
  const [tab, setTab] = useState<Tab>('status');
  const [message, setMessage] = useState('');
  const [commitBusy, setCommitBusy] = useState(false);
  const [newBranch, setNewBranch] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void git.refresh();
  }, []);

  async function handleCommit(): Promise<void> {
    if (!message.trim()) return;
    setCommitBusy(true);
    setError(null);
    const result = await git.commit(message);
    setCommitBusy(false);
    if (result.ok) {
      setMessage('');
    } else {
      setError(result.error ?? 'Commit failed');
    }
  }

  async function handlePush(): Promise<void> {
    setError(null);
    const result = await git.push();
    if (!result.ok) setError(result.error ?? 'Push failed');
  }

  async function handlePull(): Promise<void> {
    setError(null);
    const result = await git.pull();
    if (!result.ok) setError(result.error ?? 'Pull failed');
  }

  async function handleCreateBranch(): Promise<void> {
    if (!newBranch.trim()) return;
    const result = await git.createBranch(newBranch);
    if (result.ok) {
      setNewBranch('');
    } else {
      setError(result.error ?? 'Branch create failed');
    }
  }

  if (git.status.length === 0 && git.log.length === 0 && !git.loading) {
    return (
      <div className="flex flex-col gap-4 p-4">
        <div className="text-sm text-muted-foreground">
          This project is not a git repository yet.
        </div>
        <Button onClick={() => git.init()} variant="default">
          Initialize as Git Repository
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex border-b">
        <TabButton active={tab === 'status'} onClick={() => setTab('status')}>
          Status
          {git.status.length > 0 && (
            <span className="ml-2 rounded-full bg-amber-500 text-white text-xs px-2">
              {git.status.length}
            </span>
          )}
        </TabButton>
        <TabButton active={tab === 'history'} onClick={() => setTab('history')}>
          History
        </TabButton>
        <TabButton active={tab === 'branches'} onClick={() => setTab('branches')}>
          Branches
        </TabButton>
      </div>

      {error && (
        <div className="p-3 bg-red-500/10 border-b border-red-500/20 text-red-500 text-xs">
          {error}
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-4">
        {tab === 'status' && (
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold">Commit message</label>
              <Input
                placeholder="Describe your changes…"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                    void handleCommit();
                  }
                }}
              />
              <div className="flex gap-2">
                <Button onClick={handleCommit} disabled={commitBusy || !message.trim()}>
                  {commitBusy ? 'Committing…' : 'Commit'}
                </Button>
                <Button onClick={handlePush} variant="outline" disabled={git.remotes.length === 0}>
                  Push
                </Button>
                <Button onClick={handlePull} variant="outline" disabled={git.remotes.length === 0}>
                  Pull
                </Button>
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <div className="text-xs font-semibold text-muted-foreground">
                Changes ({git.status.length})
              </div>
              {git.status.length === 0 ? (
                <div className="text-xs text-muted-foreground italic">Working tree clean</div>
              ) : (
                git.status.map((entry) => (
                  <div
                    key={entry.file}
                    className="flex items-center gap-2 text-xs py-1 px-2 rounded hover:bg-muted"
                  >
                    <StatusBadge type={entry.type} />
                    <span className="truncate flex-1">{entry.file}</span>
                  </div>
                ))
              )}
            </div>

            <RemotesSection />
          </div>
        )}

        {tab === 'history' && (
          <div className="flex flex-col gap-2">
            {git.log.length === 0 ? (
              <div className="text-xs text-muted-foreground italic">No commits yet</div>
            ) : (
              git.log.map((entry) => (
                <div key={entry.oid} className="border-l-2 border-muted pl-3 py-1">
                  <div className="text-xs font-semibold">{entry.message}</div>
                  <div className="text-xs text-muted-foreground">
                    {entry.author.name} · {new Date(entry.author.timestamp * 1000).toLocaleString()}
                  </div>
                  <div className="text-xs text-muted-foreground font-mono">
                    {entry.oid.slice(0, 7)}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {tab === 'branches' && (
          <div className="flex flex-col gap-4">
            <div className="flex gap-2">
              <Input
                placeholder="new-branch-name"
                value={newBranch}
                onChange={(e) => setNewBranch(e.target.value)}
              />
              <Button onClick={handleCreateBranch} disabled={!newBranch.trim()}>
                Create
              </Button>
            </div>
            <div className="flex flex-col gap-1">
              {git.branches.map((b) => (
                <button
                  key={b}
                  className={`text-left text-xs py-1 px-2 rounded ${
                    b === git.currentBranch ? 'bg-muted font-semibold' : 'hover:bg-muted'
                  }`}
                  onClick={() => git.checkout(b)}
                >
                  {b === git.currentBranch ? '✓ ' : ''}
                  {b}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }): React.ReactElement {
  return (
    <button
      className={`px-3 py-2 text-xs font-medium border-b-2 ${
        active ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
      }`}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

function StatusBadge({ type }: { type: string }): React.ReactElement {
  const color =
    type === 'added' || type === 'untracked'
      ? 'bg-green-500'
      : type === 'modified'
      ? 'bg-amber-500'
      : type === 'deleted'
      ? 'bg-red-500'
      : 'bg-gray-500';
  const label = type === 'untracked' ? 'U' : type === 'modified' ? 'M' : type === 'added' ? 'A' : type === 'deleted' ? 'D' : '?';
  return (
    <span className={`${color} text-white text-[10px] font-bold rounded px-1.5 w-5 text-center`}>
      {label}
    </span>
  );
}

function RemotesSection(): React.ReactElement {
  const git = useGitStore();
  const [newRemote, setNewRemote] = useState('');
  const [busy, setBusy] = useState(false);

  async function handleAddOrigin(): Promise<void> {
    if (!newRemote.trim()) return;
    setBusy(true);
    await git.addRemote('origin', newRemote);
    setBusy(false);
    setNewRemote('');
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="text-xs font-semibold text-muted-foreground">Remotes</div>
      {git.remotes.length === 0 ? (
        <div className="text-xs text-muted-foreground italic">No remotes configured</div>
      ) : (
        git.remotes.map((r) => (
          <div key={r.name} className="text-xs font-mono break-all">
            {r.name} → {r.url}
          </div>
        ))
      )}
      <div className="flex gap-2">
        <Input
          placeholder="https://github.com/user/repo.git"
          value={newRemote}
          onChange={(e) => setNewRemote(e.target.value)}
        />
        <Button onClick={handleAddOrigin} disabled={!newRemote.trim() || busy} variant="outline">
          Add
        </Button>
      </div>
    </div>
  );
}
