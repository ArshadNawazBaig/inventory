import {
  AuditLogListResponseSchema,
  AuditLogResponseSchema,
  type AuditLogListQuery,
  type AuditLogListResponse,
  type AuditLogResponse,
} from '@stockflow/types';
import { apiRequest } from '@/lib/api';

const BASE = '/v1/audit-logs';

/** Audit REST bindings (read-only). Each call validates the response against the shared Zod contract. */
export function listAuditLogs(query: AuditLogListQuery, signal?: AbortSignal): Promise<AuditLogListResponse> {
  return apiRequest(BASE, {
    query: {
      page: query.page,
      limit: query.limit,
      sort: query.sort,
      action: query.action,
      entityType: query.entityType,
      entityId: query.entityId,
      actorId: query.actorId,
      from: query.from,
      to: query.to,
    },
    schema: AuditLogListResponseSchema,
    ...(signal ? { signal } : {}),
  });
}

export function getAuditLog(id: string, signal?: AbortSignal): Promise<AuditLogResponse> {
  return apiRequest(`${BASE}/${id}`, {
    schema: AuditLogResponseSchema,
    ...(signal ? { signal } : {}),
  });
}
