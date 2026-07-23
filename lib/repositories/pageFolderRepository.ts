/**
 * Page folder repository shim — alias for the new file system repository.
 */
export { getAllPublishedPageFolders } from './pageFoldersRepository.shim';

export async function getAllPageFolders(_draft: boolean = false): Promise<any[]> {
  return [];
}
