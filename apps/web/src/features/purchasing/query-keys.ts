import type { PurchaseOrderListQuery } from '@stockflow/types';

/** TanStack Query keys for Purchasing. Any mutation invalidates `all` (lists) and the affected detail. */
export const purchaseOrderKeys = {
  all: ['purchase-orders'] as const,
  list: (query: PurchaseOrderListQuery) => ['purchase-orders', 'list', query] as const,
  detail: (id: string) => ['purchase-orders', 'detail', id] as const,
};
