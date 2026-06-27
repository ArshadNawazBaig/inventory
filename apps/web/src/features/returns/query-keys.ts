import type { ReturnListQuery } from '@stockflow/types';

/** TanStack Query keys for Returns. Any mutation invalidates `all` (lists) and the affected detail. */
export const returnKeys = {
  all: ['returns'] as const,
  list: (query: ReturnListQuery) => ['returns', 'list', query] as const,
  detail: (id: string) => ['returns', 'detail', id] as const,
};
