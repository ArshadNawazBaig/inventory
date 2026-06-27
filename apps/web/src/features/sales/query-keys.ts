import type { SalesOrderListQuery } from '@stockflow/types';

/** TanStack Query keys for Sales. Any mutation invalidates `all` (lists) and the affected detail. */
export const salesOrderKeys = {
  all: ['sales-orders'] as const,
  list: (query: SalesOrderListQuery) => ['sales-orders', 'list', query] as const,
  detail: (id: string) => ['sales-orders', 'detail', id] as const,
};
