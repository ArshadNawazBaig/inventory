import type { ListProductsQuery } from '@stockflow/types';

/**
 * Centralised TanStack Query key factory for the catalog. Hierarchical and serialisable so callers can
 * invalidate at any granularity: `productKeys.all` (everything), `productKeys.lists()` (every list),
 * or `productKeys.detail(id)` (one product). Keeping keys in one place prevents the classic
 * "stale after mutation because the invalidate key didn't match" bug.
 */
export const productKeys = {
  all: ['products'] as const,
  lists: () => [...productKeys.all, 'list'] as const,
  list: (query: ListProductsQuery) => [...productKeys.lists(), query] as const,
  details: () => [...productKeys.all, 'detail'] as const,
  detail: (productId: string) => [...productKeys.details(), productId] as const,
  variants: (productId: string) => [...productKeys.detail(productId), 'variants'] as const,
} as const;
