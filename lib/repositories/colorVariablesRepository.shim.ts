/**
 * Color variables shim — reads from the file-system project.
 */
import { isDesktop, colorVariablesApi } from '@/lib/api';

export async function generateColorVariablesCss(): Promise<string> {
  if (!isDesktop()) return '';
  const vars = await colorVariablesApi.list();
  return vars
    .map((v: any) => `  --${(v.name ?? v.key ?? '').toString().toLowerCase().replace(/\s+/g, '-')}: ${v.value};`)
    .join('\n');
}
