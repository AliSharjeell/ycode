/**
 * YCode Editor Layout (Server Component)
 *
 * The legacy YCodeBuilderMain depended on the deleted CMS, Supabase, and
 * AI layers and is now broken. The new desktop shell lives in the route
 * page (`app/(builder)/ycode/page.tsx`) and renders the editor itself.
 * This layout is a pass-through that only sets `dynamic = 'force-dynamic'`
 * so `/ycode/*` routes are not statically prerendered.
 *
 * Once the visual editor is fully migrated to the new IPC API, the
 * new editor shell can be moved here so it persists across route changes.
 */
export const dynamic = 'force-dynamic';

export default function YCodeLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
