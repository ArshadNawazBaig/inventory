import { Schema } from 'mongoose';
import type { NotificationType } from '@stockflow/types';

/**
 * Mongoose schema for the per-recipient `notifications` inbox. Conventions match the rest of the codebase:
 * - **`_id` is the service-generated 24-hex string** (from `ObjectIdGenerator`), stored as a `String` — the
 *   mapper is just `id ⇄ _id`.
 * - All id-like / tenant / recipient fields are **strings**.
 * - Read state is the nullable `readAt` timestamp (null = unread). `versionKey` is off.
 */

export const NOTIFICATION_MODEL = 'Notification';

/** The stored notification document — the entity shape with `id` replaced by `_id`. */
export interface NotificationDoc {
  _id: string;
  organizationId: string;
  recipientId: string;
  type: NotificationType;
  title: string;
  body: string;
  entityType: string | null;
  entityId: string | null;
  link: string | null;
  readAt: Date | null;
  createdAt: Date;
}

export const NotificationSchema = new Schema<NotificationDoc>(
  {
    _id: { type: String },
    organizationId: { type: String, required: true },
    recipientId: { type: String, required: true },
    type: { type: String, required: true },
    title: { type: String, required: true },
    body: { type: String, required: true },
    entityType: { type: String, default: null },
    entityId: { type: String, default: null },
    link: { type: String, default: null },
    readAt: { type: Date, default: null },
    createdAt: { type: Date, required: true },
  },
  { collection: 'notifications', versionKey: false },
);
// The inbox list (newest first for a recipient) and the unread-count badge.
NotificationSchema.index({ organizationId: 1, recipientId: 1, createdAt: -1 });
NotificationSchema.index({ organizationId: 1, recipientId: 1, readAt: 1 });
