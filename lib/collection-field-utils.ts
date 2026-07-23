/**
 * @deprecated Stub for the deleted CMS collection-field utils.
 *
 * The desktop app has no CMS. The visual editor code still imports from
 * here (legacy CMS-driven rich text, links, etc.). This stub preserves
 * the import surface so the renderer compiles.
 */
/* eslint-disable @typescript-eslint/no-explicit-any */

export const MULTI_ASSET_COLLECTION_ID = 'multi-asset';
export const MULTI_ASSET_VIRTUAL_FIELDS: any[] = [];
export const REF_PAGE_PREFIX = 'page:';
export const REF_COLLECTION_PREFIX = 'collection:';

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

// Field-type unions and constants.
export const IMAGE_FIELD_TYPES: any[] = [];
export const VIDEO_FIELD_TYPES: any[] = [];
export const AUDIO_FIELD_TYPES: any[] = [];
export const COLOR_FIELD_TYPES: any[] = [];
export const SIMPLE_TEXT_FIELD_TYPES: any[] = [];
export const RICH_TEXT_FIELD_TYPES: any[] = [];
export const DATE_FIELD_TYPES: any[] = [];
export const NUMBER_FIELD_TYPES: any[] = [];
export const BOOLEAN_FIELD_TYPES: any[] = [];
export const ASSET_FIELD_TYPES: any[] = [];

// Field group/filter utilities.
export type FieldGroup = any;
export type FieldSourceType = any;
export const filterFieldGroupsByType = (_groups: any, _type: any): any[] => [];
export const flattenFieldGroups = (_groups: any): any[] => [];
export const buildFieldGroupsForLayer = (_layer: any, _ctx: any): any[] => [];
export const buildMultiAssetVirtualFields = (_fields: any): any[] => [];
export const isVirtualAssetField = (_field: any): boolean => false;
export const isDateFieldType = (_type: string): boolean => false;

// More utility functions
export const getCollectionFieldsByCollectionId = (_id: string): any[] => [];
export const getCollectionItemById = (_id: string): any | null => null;
export const getCollectionItemsByIds = (_ids: string[]): any[] => [];
export const getCollectionItemsByCollectionId = (_id: string): any[] => [];
export const getCollectionItemValueByItemAndField = (_i: string, _f: string): any => null;
export const getCollectionItemValuesByItemIds = (_ids: string[]): any[] => [];
export const getCollectionCount = (_id: string): Promise<number> => Promise.resolve(0);
export const compareDateFilter = (_a: any, _b: any): number => 0;
export const findDisplayField = (_fields: any[]): any => null;
export const formatFieldValue = (_value: any, _field: any): string => '';
export const castValue = (_value: any, _type: any): any => _value;
export const enrichItemsWithCountValues = (_items: any[], _fields: any[]): any[] => _items;
export const getItemsWithValues = (_id: string): Promise<any[]> => Promise.resolve([]);
export const getItemsWithValuesByIds = (_ids: string[]): Promise<any[]> => Promise.resolve([]);
export const getItemWithValues = (_id: string): Promise<any | null> => Promise.resolve(null);
export const getCmsTranslationsForItems = (_ids: string[]): Promise<any[]> => Promise.resolve([]);

// Variable helpers.
export const parseValueToContent = (_value: any, _opts?: any): any => null;
export const getVariableLabel = (_variable: any): string => '';

// Field-group components
export const FieldSelectDropdown = (_props: any): any => null;
export const FieldGroup = (_props: any): any => null;

// Additional exports needed by the legacy editor code
export const buildGlobalsMetaMap = (_globals: any): any => ({});
export const buildGlobalsValueMap = (_globals: any): any => ({});
export const getResourceLockKey = (_type: string, _id: string): string => `${_type}:${_id}`;
export const getSlugsByItemIds = (_ids: string[]): Promise<Record<string, string>> => Promise.resolve({});
export const hasDynamicDateRule = (_layer: any): boolean => false;
export const isAssetFieldType = (_type: string): boolean => false;
export const isDateOnlyString = (_v: any): boolean => false;
export const isDatePreset = (_v: any): boolean => false;
export const isDynamicDateCondition = (_c: any): boolean => false;
export const isCollectionItemKeyword = (_v: any): boolean => false;
export const parseCollectionLinkValue = (_v: any): any => null;
export const buildPageHreflangAlternates = (_p: any): any[] => [];

export const mergeGlobalsIntoFieldData = (_data: any, _globals: any, _ctx: any): any => _data;

export const parseItemIdList = (_v: any): string[] => [];
export const resolveDateFilterValue = (_field: any, _value: any, _ctx: any): any => _value;
