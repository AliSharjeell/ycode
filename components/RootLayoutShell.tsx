/**
 * Minimal shared layout shell.
 *
 * The original RootLayoutShell had extensive metadata, fonts, and dark
 * mode wiring. This stripped version provides the same HTML/body
 * scaffolding so the (builder) and (site) layouts render.
 */
import React from 'react';

export const defaultMetadata = {
  title: 'Ycode',
  description: 'A visual website builder for your desktop.',
};

interface RootLayoutShellProps {
  children: React.ReactNode;
  bodyClassName?: string;
  headElements?: React.ReactNode;
  lang?: string;
}

export default function RootLayoutShell({
  children,
  bodyClassName = '',
  headElements,
  lang = 'en',
}: RootLayoutShellProps): React.ReactElement {
  return (
    <html lang={lang}>
      <head>{headElements}</head>
      <body className={bodyClassName}>{children}</body>
    </html>
  );
}
