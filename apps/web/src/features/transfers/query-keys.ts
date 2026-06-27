import type { TransferListQuery } from '@stockflow/types';

/** TanStack Query keys for Transfers. Any mutation invalidates `all` (lists) and the affected detail. */
export const transferKeys = {
  all: ['transfers'] as const,
  list: (query: TransferListQuery) => ['transfers', 'list', query] as const,
  detail: (id: string) => ['transfers', 'detail', id] as const,
};
