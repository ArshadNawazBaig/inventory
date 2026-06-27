'use client';

import { keepPreviousData, useQuery } from '@tanstack/react-query';
import type { LocationListQuery } from '@stockflow/types';
import { listLocations } from './api';
import { locationQueryKeys } from './query-keys';

/** Paginated/filtered list for the location admin table. Disabled until a warehouse is chosen. */
export function useLocationList(query: LocationListQuery, enabled: boolean) {
  return useQuery({
    queryKey: locationQueryKeys.list(query),
    queryFn: ({ signal }) => listLocations(query, signal),
    placeholderData: keepPreviousData,
    enabled,
  });
}

/** A warehouse's active locations — feeds the parent picker. */
export function useActiveLocations(warehouseId: string) {
  return useQuery({
    queryKey: locationQueryKeys.active(warehouseId),
    queryFn: ({ signal }) =>
      listLocations({ page: 1, limit: 100, sort: 'path', status: 'active', warehouseId }, signal),
    enabled: Boolean(warehouseId),
  });
}
