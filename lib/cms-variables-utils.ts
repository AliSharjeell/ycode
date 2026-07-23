/**
 * @deprecated Stub for the deleted CMS variables utils. No-op.
 */
/* eslint-disable @typescript-eslint/no-explicit-any */

export function resolveCMSVariables(_input: any, _ctx: any): any {
  return _input;
}

export function getCMSVariablesUsage(_layer: any): any[] {
  return [];
}

export function buildFieldVariablePath(_field: any): string {
  return '';
}

export function resolveFieldFromSources(_field: any, _sources: any): any {
  return null;
}

export function parseValueToContent(_value: any, _opts?: any): any {
  return null;
}

export function getVariableLabel(_variable: any): string {
  return '';
}


export const formatFieldValue = (_value: any, _field: any): string => {
  if (_value == null) return '';
  return String(_value);
};
export const buildPageHreflangAlternates = (_p: any): any[] => [];
