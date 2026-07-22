/**
 * Utility helpers used by the shadcn/ui components.
 */
import { type ClassValue, clsx } from 'clsx';
import * as React from 'react';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

export function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(decimals))} ${sizes[i]}`;
}

export function debounce<T extends (...args: any[]) => unknown>(
  fn: T,
  delay: number,
): (...args: Parameters<T>) => void {
  let timer: ReturnType<typeof setTimeout> | null = null;
  return (...args: Parameters<T>) => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

export function isMac(): boolean {
  return typeof navigator !== 'undefined' && /Mac|iPad|iPhone/.test(navigator.platform);
}

export function shortId(prefix?: string): string {
  const id = crypto.randomUUID().slice(0, 8);
  return prefix ? `${prefix}_${id}` : id;
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function useForwardedRef<T>(ref: React.ForwardedRef<T>): React.RefObject<T | null> {
  const innerRef = React.useRef<T>(null);
  React.useImperativeHandle(ref, () => innerRef.current as T);
  return innerRef;
}
