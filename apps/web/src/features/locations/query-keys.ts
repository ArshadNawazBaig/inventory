import type { LocationListQuery } from '@stockflow/types';

/**
 * TanStack Query keys for Locations. All location queries live under the `locations` namespace; any
 * mutation invalidates `locationQueryKeys.all` to refresh every warehouse's list AND the active picker set.
 */
export const locationQueryKeys = {
  all: ['locations'] as const,
  list: (query: LocationListQuery) => ['locations', 'list', query] as const,
  active: (warehouseId: string) => ['locations', 'active', warehouseId] as const,
};
