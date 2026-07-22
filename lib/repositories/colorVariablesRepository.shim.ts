/**
 * Color variables shim — reads from the file-system project.
 */
import { isDesktop, colorVariablesApi } from '@/lib/api';

export async function generateColorVariablesCss(): Promise<string> {
  if (!isDesktop()) return '';
  const vars = await colorVariablesApi.list();
  return vars
    .map((v: { key: string; value: string }) => `  --${v.key}: ${v.value};`)
    .join('\n');
}
