import type { StockLevelListQuery, StockMovementListQuery } from '@stockflow/types';

/**
 * TanStack Query keys for Inventory. A successful adjustment invalidates `inventoryKeys.all`, refreshing
 * both the levels projection and the movements ledger views.
 */
export const inventoryKeys = {
  all: ['inventory'] as const,
  levels: (query: StockLevelListQuery) => ['inventory', 'levels', query] as const,
  movements: (query: StockMovementListQuery) => ['inventory', 'movements', query] as const,
};
