import type { AuditActorType, AuditMetadata } from '@stockflow/types';

/**
 * Audit-log domain entity (DATABASE §audit-logs). **Immutable & append-only** — never updated, never deleted.
 * `before`/`after` hold an optional redacted diff snapshot (null for interceptor-sourced entries); `metadata`
 * carries request context (ip/userAgent/requestId/method/path/status). Framework-free.
 */
export interface AuditLogEntity {
  id: string;
  organizationId: string;
  actorId: string | null;
  actorType: AuditActorType;
  action: string;
  entityType: string;
  entityId: string | null;
  before: unknown | null;
  after: unknown | null;
  metadata: AuditMetadata;
  createdAt: Date;
}
