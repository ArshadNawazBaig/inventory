'use client';

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { listLocations } from '@/features/locations/api';
import { WAREHOUSES } from '@/features/locations/descriptors';
import { useActiveResources } from '@/features/resources/queries';

/**
 * Resolve a `locationId` to a human label (`warehouse · path`) for the inventory tables, which carry ids.
 * Loads the tenant's active warehouses + locations once and builds an id→label map. (Capped at 100 each
 * for now — full pagination of the resolver is a follow-up.)
 */
export function useLocationLabels(): (locationId: string) => string {
  const warehouses = useActiveResources(WAREHOUSES);
  const locations = useQuery({
    queryKey: ['inventory', 'location-labels'],
    queryFn: ({ signal }) =>
      listLocations({ page: 1, limit: 100, sort: 'path', status: 'active' }, signal),
  });

  const labels = useMemo(() => {
    const warehouseNames = new Map((warehouses.data?.data ?? []).map((w) => [w.id, w.name]));
    const map = new Map<string, string>();
    for (const location of locations.data?.data ?? []) {
      const warehouseName = warehouseNames.get(location.warehouseId) ?? 'Warehouse';
      map.set(location.id, `${warehouseName} · ${location.path}`);
    }
    return map;
  }, [warehouses.data, locations.data]);

  return (locationId: string) => labels.get(locationId) ?? locationId;
}
