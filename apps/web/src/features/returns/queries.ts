'use client';

import { keepPreviousData, useQuery } from '@tanstack/react-query';
import type { ReturnListQuery } from '@stockflow/types';
import { getReturn, listReturns } from './api';
import { returnKeys } from './query-keys';

/** Paginated/filtered return list. */
export function useReturns(query: ReturnListQuery) {
  return useQuery({
    queryKey: returnKeys.list(query),
    queryFn: ({ signal }) => listReturns(query, signal),
    placeholderData: keepPreviousData,
  });
}

/** A single return with its lines. Disabled until an id is available. */
export function useReturn(id: string | undefined) {
  return useQuery({
    queryKey: returnKeys.detail(id ?? ''),
    queryFn: ({ signal }) => getReturn(id as string, signal),
    enabled: Boolean(id),
  });
}
