'use client';

import { keepPreviousData, useQuery } from '@tanstack/react-query';
import type { SalesOrderListQuery } from '@stockflow/types';
import { getSalesOrder, listSalesOrders } from './api';
import { salesOrderKeys } from './query-keys';

/** Paginated/filtered sales-order list. */
export function useSalesOrders(query: SalesOrderListQuery) {
  return useQuery({
    queryKey: salesOrderKeys.list(query),
    queryFn: ({ signal }) => listSalesOrders(query, signal),
    placeholderData: keepPreviousData,
  });
}

/** A single sales order with its lines. Disabled until an id is available. */
export function useSalesOrder(id: string | undefined) {
  return useQuery({
    queryKey: salesOrderKeys.detail(id ?? ''),
    queryFn: ({ signal }) => getSalesOrder(id as string, signal),
    enabled: Boolean(id),
  });
}
