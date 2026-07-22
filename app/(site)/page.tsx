/**
 * Public homepage. The desktop app doesn't ship a hosted site; the
 * static site generator emits a complete site into <project>/out/ when
 * the user clicks "Build Site". This route is here only so the dev
 * server has something to render.
 */
import RootLayoutShell from '@/components/RootLayoutShell';

export const dynamic = 'force-static';

export default function HomePage() {
  return (
    <RootLayoutShell bodyClassName="font-sans">
      <main className="flex flex-col items-center justify-center min-h-screen p-8 text-center">
        <h1 className="text-2xl font-semibold mb-2">Ycode</h1>
        <p className="text-sm text-muted-foreground max-w-md">
          This is the desktop editor. Open the Electron app to start a new project,
          or browse the static export under <code>out/index.html</code>.
        </p>
      </main>
    </RootLayoutShell>
  );
}
