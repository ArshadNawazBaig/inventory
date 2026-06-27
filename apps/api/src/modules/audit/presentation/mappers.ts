import type { AuditLogResponse } from '@stockflow/types';
import type { AuditLogEntity } from '../domain/entities';

/** Map an audit entity to its API response (tenant is implicit; `organizationId` is never exposed). */
export function toAuditLogResponse(entry: AuditLogEntity): AuditLogResponse {
  return {
    id: entry.id,
    action: entry.action,
    entityType: entry.entityType,
    entityId: entry.entityId,
    actorId: entry.actorId,
    actorType: entry.actorType,
    before: entry.before ?? null,
    after: entry.after ?? null,
    metadata: entry.metadata,
    createdAt: entry.createdAt.toISOString(),
  };
}
