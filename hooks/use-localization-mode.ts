'use client';

/**
 * Stub for the deleted localization-mode hook. No-op.
 */
import { useState } from 'react';

export function useLocalizationMode(): {
  enabled: boolean;
  toggle: () => void;
  setEnabled: (next: boolean) => void;
} {
  const [enabled, setEnabled] = useState(false);
  return {
    enabled,
    toggle: () => setEnabled((v) => !v),
    setEnabled,
  };
}
