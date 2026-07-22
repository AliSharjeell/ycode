'use client';

/**
 * GitHub connect dialog — drives the OAuth Device Flow.
 *
 * 1. User clicks "Connect GitHub".
 * 2. We start the device flow and show the user code + verification URL.
 * 3. User goes to github.com/login/device and pastes the code.
 * 4. We poll until GitHub grants the token.
 */
import React, { useEffect, useState } from 'react';
import { useGitHubStore } from '@/stores/useGitHubStore';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function GitHubConnectDialog({ open, onOpenChange }: Props): React.ReactElement {
  const github = useGitHubStore();
  const [status, setStatus] = useState<'idle' | 'starting' | 'waiting' | 'done' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setStatus('idle');
      setError(null);
      github.cancelDeviceFlow();
    }
  }, [open]);

  async function startFlow(): Promise<void> {
    setStatus('starting');
    setError(null);
    const result = await github.startDeviceFlow();
    if (result.ok) {
      setStatus('waiting');
      void poll();
    } else {
      setStatus('error');
      setError(result.error ?? 'Failed to start flow');
    }
  }

  async function poll(): Promise<void> {
    let elapsed = 0;
    const maxMs = 600_000;
    while (elapsed < maxMs) {
      await new Promise((r) => setTimeout(r, 5000));
      elapsed += 5000;
      const result = await github.pollDeviceFlow();
      if (result.ok) {
        setStatus('done');
        onOpenChange(false);
        return;
      }
      if (result.error === 'pending') continue;
      setStatus('error');
      setError(result.error ?? 'Failed to connect');
      return;
    }
    setStatus('error');
    setError('Timed out');
  }

  async function handleDisconnect(): Promise<void> {
    await github.disconnect();
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Connect GitHub</DialogTitle>
        </DialogHeader>

        {github.connected ? (
          <div className="flex flex-col gap-3">
            <div className="text-sm">
              Connected as <span className="font-semibold">{github.login}</span>
            </div>
            <Button onClick={handleDisconnect} variant="outline">
              Disconnect
            </Button>
          </div>
        ) : status === 'idle' ? (
          <div className="flex flex-col gap-3">
            <p className="text-sm text-muted-foreground">
              Connect your GitHub account to push and pull repositories directly from Ycode.
            </p>
            <Button onClick={startFlow}>Connect GitHub</Button>
          </div>
        ) : status === 'starting' ? (
          <div className="text-sm">Requesting device code…</div>
        ) : status === 'waiting' && github.deviceFlow ? (
          <div className="flex flex-col gap-3">
            <p className="text-sm">
              Visit{' '}
              <a
                href={github.deviceFlow.verificationUri}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline"
              >
                {github.deviceFlow.verificationUri}
              </a>{' '}
              and enter the code:
            </p>
            <div className="bg-muted rounded p-3 font-mono text-lg text-center select-all">
              {github.deviceFlow.userCode}
            </div>
            <div className="text-xs text-muted-foreground">
              Waiting for you to authorize on GitHub…
            </div>
          </div>
        ) : status === 'error' ? (
          <div className="flex flex-col gap-3">
            <div className="text-sm text-red-500">{error}</div>
            <Button onClick={startFlow} variant="outline">
              Try Again
            </Button>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
