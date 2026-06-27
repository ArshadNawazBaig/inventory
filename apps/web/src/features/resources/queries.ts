'use client';

import { keepPreviousData, useQuery } from '@tanstack/react-query';
import type { LookupListQuery } from '@stockflow/types';
import { listResources } from './api';
import type { ResourceDescriptor } from './descriptor';
import { resourceKeys } from './query-keys';
import type { ResourceRecord } from './types';

/** Paginated/filtered list for a resource admin table. */
export function useResourceList<T extends ResourceRecord>(
  descriptor: ResourceDescriptor<T>,
  query: LookupListQuery,
) {
  return useQuery({
    queryKey: resourceKeys(descriptor.resource).list(query),
    queryFn: ({ signal }) => listResources(descriptor, query, signal),
    placeholderData: keepPreviousData,
  });
}

const ACTIVE_QUERY: LookupListQuery = { page: 1, limit: 100, sort: 'name', status: 'active' };

/** The active rows for a resource — feeds the pickers (ResourceSelect). Cached under an `active` key. */
export function useActiveResources<T extends ResourceRecord>(descriptor: ResourceDescriptor<T>) {
  return useQuery({
    queryKey: resourceKeys(descriptor.resource).active(),
    queryFn: ({ signal }) => listResources(descriptor, ACTIVE_QUERY, signal),
  });
}
