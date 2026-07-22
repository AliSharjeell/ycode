/**
 * Compatibility shim for the old `(lib/repositories/*).ts` surface.
 *
 * The legacy editor code calls functions like `getSettingByKey`,
 * `getAllPages`, `getItemsByCollectionId`. We re-export those functions
 * with the same signatures, but back them with the new file-system
 * project model. This keeps the visual editor working while the long
 * tail of files is migrated to the new IPC API.
 *
 * NOTE: many of these functions are intentionally stubs. The desktop
 * app does not have CMS collections, locales, translations, or versions.
 * Calls to those will return empty arrays. The visual editor UI will
 * show empty states instead of crashing.
 */
export { getSettingByKey, getSettingsByKeys } from './settingsRepository.shim';
export { getAllPages } from './pagesRepository.shim';
export { getAllPublishedPageFolders } from './pageFoldersRepository.shim';
export { getAllLocales } from './localesRepository.shim';
export { getSlugTranslationsByLocale } from './translationsRepository.shim';
export { getItemsByCollectionId } from './collectionItemsRepository.shim';
export { getValuesByItemIds } from './collectionItemValuesRepository.shim';
export { generateColorVariablesCss } from './colorVariablesRepository.shim';
