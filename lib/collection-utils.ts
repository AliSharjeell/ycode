/**
 * @deprecated Stub for the deleted CMS collection utils.
 *
 * The desktop app has no CMS. These functions are no-ops or return
 * empty data so the visual editor's layer tree can still render any
 * legacy collection-layer references.
 */
/* eslint-disable @typescript-eslint/no-explicit-any */

export function remapLayerIdsForCollectionItem(_layer: any, _item: any): any {
  return _layer;
}

export function getCollectionsByFieldId(_fieldId: string): any[] {
  return [];
}

export function getCollectionById(_id: string): any | null {
  return null;
}

export function getCollectionSlug(_id: string): string {
  return '';
}

// Additional exports needed by the legacy editor code
export function castValue(_value: any, _type: any): any {
  return _value;
}
export function getCollectionCounts(): any[] {
  return [];
}

// Additional stubs for legacy editor code
export const normalizeBooleanValue = (_v: any): boolean => !!_v;
export const parseMultiReferenceValue = (_v: any): string[] => [];
export const compareDateFilter = (_a: any, _b: any): number => 0;
export const isDateFieldType = (_t: any): boolean => false;
export const isDatePreset = (_v: any): boolean => false;
export const parseItemIdList = (_v: any): string[] => [];
export const resolveDateFieldValue = (_field: any, _value: any, _ctx: any): any => _value;
export const resolveReferenceFieldsSync = (_layer: any, _items: any[]): any => _layer;
