/**
 * Stub for the deleted CMS collections store.
 *
 * The desktop app has no CMS. This stub preserves the import surface so
 * legacy editor code (LayerRenderer, etc.) compiles without breaking.
 * Calling any of these methods is a no-op; reads return empty.
 */
import { create } from 'zustand';

interface CollectionItem {
  id: string;
  collection_id: string;
  [key: string]: unknown;
}

interface CollectionsState {
  collections: any[];
  items: CollectionItem[];
  selectedCollectionId: string | null;
  selectedItemId: string | null;
  isLoading: boolean;
  // no-op methods preserved for source compatibility
  loadCollections: () => Promise<void>;
  loadItems: (collectionId: string) => Promise<void>;
  setSelectedCollectionId: (id: string | null) => void;
  setSelectedItemId: (id: string | null) => void;
}

export const useCollectionsStore = create<CollectionsState>((set) => ({
  collections: [],
  items: [],
  selectedCollectionId: null,
  selectedItemId: null,
  isLoading: false,
  loadCollections: async () => {},
  loadItems: async () => {},
  setSelectedCollectionId: (id) => set({ selectedCollectionId: id }),
  setSelectedItemId: (id) => set({ selectedItemId: id }),
}));
