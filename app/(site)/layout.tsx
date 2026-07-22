/**
 * Minimal site layout. The published pages are rendered by the static
 * site generator in `lib/static-export/`. The Next.js site routes are
 * still here so the dev server can preview during development, but the
 * runtime fetches have been removed.
 */
import '@/app/site.css';
import RootLayoutShell, { defaultMetadata } from '@/components/RootLayoutShell';

export const metadata = defaultMetadata;

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <RootLayoutShell bodyClassName="font-sans">
      {children}
    </RootLayoutShell>
  );
}
