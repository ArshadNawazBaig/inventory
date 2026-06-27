'use client';

import { keepPreviousData, useQuery } from '@tanstack/react-query';
import type { LookupListQuery } from '@stockflow/types';
import { listLookups } from './api';
import type { LookupDescriptor } from './descriptors';
import { lookupKeys } from './query-keys';
import type { LookupRecord } from './types';

/** Paginated/filtered list for a lookup admin table. */
export function useLookupList<T extends LookupRecord>(
  descriptor: LookupDescriptor<T>,
  query: LookupListQuery,
) {
  return useQuery({
    queryKey: lookupKeys(descriptor.resource).list(query),
    queryFn: ({ signal }) => listLookups(descriptor, query, signal),
    placeholderData: keepPreviousData,
  });
}

const ACTIVE_QUERY: LookupListQuery = { page: 1, limit: 100, sort: 'name', status: 'active' };

/** The active lookups for a resource — feeds the pickers (LookupSelect). Cached under an `active` key. */
export function useActiveLookups<T extends LookupRecord>(descriptor: LookupDescriptor<T>) {
  return useQuery({
    queryKey: lookupKeys(descriptor.resource).active(),
    queryFn: ({ signal }) => listLookups(descriptor, ACTIVE_QUERY, signal),
  });
}
