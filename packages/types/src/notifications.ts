import { z } from 'zod';
import { PageMetaSchema } from './catalog';

/**
 * Notification contracts — the single source of truth for validation AND types, shared by API + worker + web.
 * See docs/modules/notifications.md. In-app notifications are a **per-recipient inbox** with read state: each
 * row targets one user in one tenant. Producers enqueue through the `Notifier` port (a curated global
 * interceptor records noteworthy actions); the recipient reads/marks them read. Email + realtime delivery and
 * role/member fan-out are documented follow-ups.
 */

// ─── Permissions ───────────────────────────────────────────────────────────────
export const NOTIFICATION_PERMISSIONS = { view: 'notification.view' } as const;
export type NotificationPermission =
  (typeof NOTIFICATION_PERMISSIONS)[keyof typeof NOTIFICATION_PERMISSIONS];

// ─── Enums ─────────────────────────────────────────────────────────────────────
/** Coarse category — drives the icon + filtering; the specifics live in `title`/`body`. */
export const NOTIFICATION_TYPES = [
  'purchase_order',
  'sales_order',
  'transfer',
  'return',
  'inventory',
  'system',
] as const;
export type NotificationType = (typeof NOTIFICATION_TYPES)[number];

// ─── Responses ───────────────────────────────────────────────────────────────
export const NotificationResponseSchema = z.object({
  id: z.string(),
  type: z.enum(NOTIFICATION_TYPES),
  title: z.string(),
  body: z.string(),
  entityType: z.string().nullable(),
  entityId: z.string().nullable(),
  link: z.string().nullable(),
  readAt: z.string().nullable(),
  createdAt: z.string(),
});
export type NotificationResponse = z.infer<typeof NotificationResponseSchema>;

export const NotificationListResponseSchema = z.object({
  data: z.array(NotificationResponseSchema),
  meta: PageMetaSchema,
});
export type NotificationListResponse = z.infer<typeof NotificationListResponseSchema>;

/** Lightweight poll target for the navbar bell badge. */
export const UnreadCountResponseSchema = z.object({ count: z.number().int() });
export type UnreadCountResponse = z.infer<typeof UnreadCountResponseSchema>;

/** Result of marking the whole inbox read. */
export const MarkAllReadResponseSchema = z.object({ updated: z.number().int() });
export type MarkAllReadResponse = z.infer<typeof MarkAllReadResponseSchema>;

// ─── List query ────────────────────────────────────────────────────────────────
export const NotificationListQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    sort: z.enum(['createdAt', '-createdAt']).default('-createdAt'),
    status: z.enum(['all', 'unread', 'read']).default('all'),
    type: z.enum(NOTIFICATION_TYPES).optional(),
  })
  .strict();
export type NotificationListQuery = z.infer<typeof NotificationListQuerySchema>;
