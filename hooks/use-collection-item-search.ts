'use client';

/**
 * Stub for the deleted CMS collection-item-search hook. Returns empty.
 */
import { useState } from 'react';

export function useCollectionItemSearch(_collectionId: string | null): {
  items: any[];
  search: string;
  setSearch: (next: string) => void;
  isLoading: boolean;
} {
  const [search, setSearch] = useState('');
  return { items: [], search, setSearch, isLoading: false };
}
