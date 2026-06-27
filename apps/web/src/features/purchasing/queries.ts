'use client';

import { keepPreviousData, useQuery } from '@tanstack/react-query';
import type { PurchaseOrderListQuery } from '@stockflow/types';
import { getPurchaseOrder, listPurchaseOrders } from './api';
import { purchaseOrderKeys } from './query-keys';

/** Paginated/filtered purchase-order list. */
export function usePurchaseOrders(query: PurchaseOrderListQuery) {
  return useQuery({
    queryKey: purchaseOrderKeys.list(query),
    queryFn: ({ signal }) => listPurchaseOrders(query, signal),
    placeholderData: keepPreviousData,
  });
}

/** A single purchase order with its lines. Disabled until an id is available. */
export function usePurchaseOrder(id: string | undefined) {
  return useQuery({
    queryKey: purchaseOrderKeys.detail(id ?? ''),
    queryFn: ({ signal }) => getPurchaseOrder(id as string, signal),
    enabled: Boolean(id),
  });
}
