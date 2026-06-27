import type { AuditActorType, AuditMetadata } from '@stockflow/types';

/**
 * The write side of the audit trail — a framework-agnostic port so the cross-cutting interceptor (and, later,
 * domain callers that want rich before/after diffs) can record without importing the Audit module's internals.
 * The Audit module binds {@link AUDIT_RECORDER} to its `AuditService`.
 */
export interface AuditRecordInput {
  organizationId: string;
  actorId: string | null;
  actorType: AuditActorType;
  action: string;
  entityType: string;
  entityId: string | null;
  before?: unknown | null;
  after?: unknown | null;
  metadata: AuditMetadata;
}

export interface AuditRecorder {
  record(input: AuditRecordInput): Promise<void>;
}

/** DI token for the audit recorder (provided + exported by the Audit module). */
export const AUDIT_RECORDER = Symbol('AuditRecorder');
