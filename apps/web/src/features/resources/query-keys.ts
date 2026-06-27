import type { LookupListQuery } from '@stockflow/types';

/**
 * Per-resource TanStack Query key factory. Keyed by the resource segment so each resource has its own
 * cache namespace. `invalidateQueries({ queryKey: resourceKeys(r).all })` clears lists, the active set
 * (used by pickers), and details for that resource at once.
 */
export function resourceKeys(resource: string) {
  return {
    all: [resource] as const,
    lists: () => [resource, 'list'] as const,
    list: (query: LookupListQuery) => [resource, 'list', query] as const,
    active: () => [resource, 'active'] as const,
    details: () => [resource, 'detail'] as const,
    detail: (id: string) => [resource, 'detail', id] as const,
  };
}
