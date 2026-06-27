import type { AuditLogListQuery } from '@stockflow/types';

/** TanStack Query keys for the audit trail (read-only). */
export const auditKeys = {
  all: ['audit-logs'] as const,
  list: (query: AuditLogListQuery) => ['audit-logs', 'list', query] as const,
  detail: (id: string) => ['audit-logs', 'detail', id] as const,
};
