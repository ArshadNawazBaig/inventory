'use client';

import { keepPreviousData, useQuery } from '@tanstack/react-query';
import type { StockLevelListQuery, StockMovementListQuery } from '@stockflow/types';
import { listStockLevels, listStockMovements } from './api';
import { inventoryKeys } from './query-keys';

/** The on-hand projection (per variant × location). */
export function useStockLevels(query: StockLevelListQuery, enabled: boolean) {
  return useQuery({
    queryKey: inventoryKeys.levels(query),
    queryFn: ({ signal }) => listStockLevels(query, signal),
    placeholderData: keepPreviousData,
    enabled,
  });
}

/** The append-only ledger history. */
export function useStockMovements(query: StockMovementListQuery, enabled: boolean) {
  return useQuery({
    queryKey: inventoryKeys.movements(query),
    queryFn: ({ signal }) => listStockMovements(query, signal),
    placeholderData: keepPreviousData,
    enabled,
  });
}
