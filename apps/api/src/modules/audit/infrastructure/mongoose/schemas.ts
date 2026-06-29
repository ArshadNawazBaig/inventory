import { Schema } from 'mongoose';
import type { AuditActorType, AuditMetadata } from '@stockflow/types';

/**
 * Mongoose schema for the immutable `audit_logs` trail (DATABASE §audit-logs). Conventions match the rest of
 * the codebase:
 * - **`_id` is the service-generated 24-hex string** (from `ObjectIdGenerator`), stored as a `String` — the
 *   mapper is just `id ⇄ _id`.
 * - All id-like / tenant fields are **strings**; cross-references resolve via query services, never `populate`.
 * - `before`/`after` hold an optional redacted diff snapshot (arbitrary shape or null) → `Mixed`. `metadata`
 *   is the fixed request-context object.
 * - The collection is **append-only** (no update/delete), so there is no soft-delete flag and Mixed
 *   change-tracking is never exercised. `versionKey` is off.
 */

export const AUDIT_LOG_MODEL = 'AuditLog';

/** The stored audit document — the entity shape with `id` replaced by `_id`. */
export interface AuditLogDoc {
  _id: string;
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

export const AuditLogSchema = new Schema<AuditLogDoc>(
  {
    _id: { type: String },
    organizationId: { type: String, required: true },
    actorId: { type: String, default: null },
    actorType: { type: String, required: true },
    action: { type: String, required: true },
    entityType: { type: String, required: true },
    entityId: { type: String, default: null },
    before: { type: Object, default: null },
    after: { type: Object, default: null },
    metadata: { type: Object, required: true },
    createdAt: { type: Date, required: true },
  },
  { collection: 'audit_logs', versionKey: false },
);
// The default list view (newest first within a tenant).
AuditLogSchema.index({ organizationId: 1, createdAt: -1 });
// Entity history and actor/action drill-downs (the list filters).
AuditLogSchema.index({ organizationId: 1, entityType: 1, entityId: 1, createdAt: -1 });
AuditLogSchema.index({ organizationId: 1, actorId: 1, createdAt: -1 });
