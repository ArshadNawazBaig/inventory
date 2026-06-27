import type { InventoryValuationQuery, LowStockListQuery } from '@stockflow/types';

/** TanStack Query keys for Reports (read-only). */
export const reportKeys = {
  all: ['reports'] as const,
  valuation: (query: InventoryValuationQuery) => ['reports', 'inventory-valuation', query] as const,
  lowStock: (query: LowStockListQuery) => ['reports', 'low-stock', query] as const,
};
