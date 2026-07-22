/**
 * Stub for the deleted CMS filter store. No-op.
 */
import { create } from 'zustand';

interface FilterState {
  filters: Record<string, unknown>;
  setFilter: (key: string, value: unknown) => void;
  resetFilters: (layerId?: string) => void;
}

export const useFilterStore = create<FilterState>((set) => ({
  filters: {},
  setFilter: (key, value) => set((s) => ({ filters: { ...s.filters, [key]: value } })),
  resetFilters: () => set({ filters: {} }),
}));
