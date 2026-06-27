'use client';

import { keepPreviousData, useQuery } from '@tanstack/react-query';
import type { TransferListQuery } from '@stockflow/types';
import { getTransfer, listTransfers } from './api';
import { transferKeys } from './query-keys';

/** Paginated/filtered transfer list. */
export function useTransfers(query: TransferListQuery) {
  return useQuery({
    queryKey: transferKeys.list(query),
    queryFn: ({ signal }) => listTransfers(query, signal),
    placeholderData: keepPreviousData,
  });
}

/** A single transfer with its lines. Disabled until an id is available. */
export function useTransfer(id: string | undefined) {
  return useQuery({
    queryKey: transferKeys.detail(id ?? ''),
    queryFn: ({ signal }) => getTransfer(id as string, signal),
    enabled: Boolean(id),
  });
}
