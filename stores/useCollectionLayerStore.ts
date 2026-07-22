/**
 * Stub for the deleted CMS collection-layer store. No-op.
 */
import { create } from 'zustand';

interface CollectionLayerState {
  // empty placeholder
  fetchLayerData: (...args: any[]) => Promise<any>;
  clearLayerData: (...args: any[]) => void;
}

export const useCollectionLayerStore = create<CollectionLayerState>(() => ({
  fetchLayerData: async () => null,
  clearLayerData: () => {},
}));
