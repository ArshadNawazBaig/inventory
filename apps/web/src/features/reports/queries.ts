'use client';

import { keepPreviousData, useQuery } from '@tanstack/react-query';
import type { InventoryValuationQuery, LowStockListQuery } from '@stockflow/types';
import { getInventoryValuation, getLowStock } from './api';
import { reportKeys } from './query-keys';

/** Inventory valuation (optionally scoped to a warehouse). */
export function useInventoryValuation(query: InventoryValuationQuery = {}) {
  return useQuery({
    queryKey: reportKeys.valuation(query),
    queryFn: ({ signal }) => getInventoryValuation(query, signal),
  });
}

/** Paginated low-stock (reorder) report. */
export function useLowStock(query: LowStockListQuery) {
  return useQuery({
    queryKey: reportKeys.lowStock(query),
    queryFn: ({ signal }) => getLowStock(query, signal),
    placeholderData: keepPreviousData,
  });
}
