/**
 * YCode Editor Layout (Server Component)
 *
 * Pass-through. The desktop shell lives in the route page
 * (`app/(builder)/ycode/page.tsx`) and renders the editor itself.
 *
 * Once the visual editor is fully migrated to the new IPC API, the
 * new editor shell can be moved here so it persists across route changes.
 */
export default function YCodeLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
