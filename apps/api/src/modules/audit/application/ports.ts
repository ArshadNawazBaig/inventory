import type { AuditLogListQuery } from '@stockflow/types';
import type { AuditLogEntity } from '../domain/entities';

/**
 * Persistence port for the audit trail. **Append-only** — `insert` + reads only; no update/delete. Tenant-scoped.
 * The Mongoose adapter implements the same port (a capped/TTL'd `audit_logs` collection per DATABASE §audit-logs)
 * without touching the application.
 */
export interface AuditLogRepository {
  insert(entry: AuditLogEntity): Promise<AuditLogEntity>;
  findById(organizationId: string, id: string): Promise<AuditLogEntity | null>;
  list(organizationId: string, query: AuditLogListQuery): Promise<{ items: AuditLogEntity[]; total: number }>;
}

// ─── DI tokens (framework-agnostic symbols; wired in audit.module.ts) ─────────────
export const AUDIT_LOG_REPOSITORY = Symbol('AuditLogRepository');
export const AUDIT_ID_GENERATOR = Symbol('AuditIdGenerator');
export const AUDIT_CLOCK = Symbol('AuditClock');
