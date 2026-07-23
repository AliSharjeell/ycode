/**
 * @deprecated Stub for the deleted CMS collection-field utils.
 *
 * The desktop app has no CMS. The visual editor code still imports from
 * here (legacy CMS-driven rich text, links, etc.). This stub preserves
 * the import surface so the renderer compiles.
 */
/* eslint-disable @typescript-eslint/no-explicit-any */

export const getFieldIcon = (_type: string): string => 'field';
export const getFieldName = (_field: any): string => '';
export const getReferenceCollectionId = (_field: any): string | null => null;
export const getStatusFlagsFromAction = (_action: any): any => ({});

export function resolveFieldValue(_field: any, _item: any): any {
  return null;
}

export interface ReferenceItemOption {
  id: string;
  label: string;
  value: string;
}

export const getReferenceCollectionFields = (): any[] => [];
export const getCollectionFields = (): any[] => [];
export const getCollectionFieldByKey = (): any | null => null;
export const getCollectionFieldById = (): any | null => null;

// Type-only exports preserved so TS imports compile.
export type CollectionFieldType = any;
export type CollectionField = any;
export type CollectionItem = any;
export type StatusAction = any;
export type PageItemDuplicateResult = any;
export type ReferenceCollectionId = any;
