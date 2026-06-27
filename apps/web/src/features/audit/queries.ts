'use client';

import { keepPreviousData, useQuery } from '@tanstack/react-query';
import type { AuditLogListQuery } from '@stockflow/types';
import { getAuditLog, listAuditLogs } from './api';
import { auditKeys } from './query-keys';

/** Paginated/filtered audit-log list. */
export function useAuditLogs(query: AuditLogListQuery) {
  return useQuery({
    queryKey: auditKeys.list(query),
    queryFn: ({ signal }) => listAuditLogs(query, signal),
    placeholderData: keepPreviousData,
  });
}

/** A single audit entry (for the detail view). Disabled until an id is available. */
export function useAuditLog(id: string | undefined) {
  return useQuery({
    queryKey: auditKeys.detail(id ?? ''),
    queryFn: ({ signal }) => getAuditLog(id as string, signal),
    enabled: Boolean(id),
  });
}
