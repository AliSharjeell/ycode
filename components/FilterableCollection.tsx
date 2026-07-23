'use client';

/**
 * Stub for the deleted CMS FilterableCollection component.
 *
 * The desktop app has no CMS. This stub preserves the import surface
 * so the renderer can render a page that references a filterable
 * collection layer. It renders nothing — the rest of the layer tree
 * shows around it.
 */
import React from 'react';

export const ITEMS_INJECTED_EVENT = 'ycode:items-injected';

export interface ItemsInjectedDetail {
  layerId: string;
  items: Record<string, unknown>[];
}

export function FilterableCollection(): React.ReactElement | null {
  return null;
}

export default FilterableCollection;
