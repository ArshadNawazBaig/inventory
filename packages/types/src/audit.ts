import { z } from 'zod';
import { PageMetaSchema } from './catalog';

/**
 * Audit-log contracts — the single source of truth for validation AND types, shared by API + worker + web.
 * See docs/modules/audit.md, .claude/database/audit-logs.md and .claude/security/audit.md. The `audit_logs`
 * trail is **immutable & append-only**: who did what, when, to which entity. Entries are written server-side
 * close to the action (a global interceptor records every successful mutation) and read with `audit.view`.
 */

// ─── Permissions ───────────────────────────────────────────────────────────────
export const AUDIT_PERMISSIONS = { view: 'audit.view', export: 'audit.export' } as const;
export type AuditPermission = (typeof AUDIT_PERMISSIONS)[keyof typeof AUDIT_PERMISSIONS];

// ─── Enums ─────────────────────────────────────────────────────────────────────
/** Who performed the action — an authenticated `user`, an internal `system` job, or an `api_key`. */
export const AUDIT_ACTOR_TYPES = ['user', 'system', 'api_key'] as const;
export type AuditActorType = (typeof AUDIT_ACTOR_TYPES)[number];

// ─── Reusable field schemas ──────────────────────────────────────────────────
const looseDate = z
  .string()
  .trim()
  .refine((v) => !Number.isNaN(Date.parse(v)), 'Must be a valid date (YYYY-MM-DD or ISO-8601)');

/** Request-context metadata captured with each entry (never secrets/PII — redact at the source). */
export const AuditMetadataSchema = z.object({
  ip: z.string().nullable(),
  userAgent: z.string().nullable(),
  requestId: z.string().nullable(),
  method: z.string().nullable(),
  path: z.string().nullable(),
  statusCode: z.number().int().nullable(),
});
export type AuditMetadata = z.infer<typeof AuditMetadataSchema>;

// ─── Responses ───────────────────────────────────────────────────────────────
export const AuditLogResponseSchema = z.object({
  id: z.string(),
  action: z.string(),
  entityType: z.string(),
  entityId: z.string().nullable(),
  actorId: z.string().nullable(),
  actorType: z.enum(AUDIT_ACTOR_TYPES),
  before: z.unknown().nullable(),
  after: z.unknown().nullable(),
  metadata: AuditMetadataSchema,
  createdAt: z.string(),
});
export type AuditLogResponse = z.infer<typeof AuditLogResponseSchema>;

export const AuditLogListResponseSchema = z.object({
  data: z.array(AuditLogResponseSchema),
  meta: PageMetaSchema,
});
export type AuditLogListResponse = z.infer<typeof AuditLogListResponseSchema>;

// ─── List query ────────────────────────────────────────────────────────────────
export const AuditLogListQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    sort: z.enum(['createdAt', '-createdAt']).default('-createdAt'),
    action: z.string().trim().min(1).max(100).optional(),
    entityType: z.string().trim().min(1).max(60).optional(),
    entityId: z.string().trim().min(1).max(60).optional(),
    actorId: z.string().trim().min(1).max(60).optional(),
    /** Inclusive lower/upper bounds on `createdAt`. */
    from: looseDate.optional(),
    to: looseDate.optional(),
  })
  .strict();
export type AuditLogListQuery = z.infer<typeof AuditLogListQuerySchema>;
