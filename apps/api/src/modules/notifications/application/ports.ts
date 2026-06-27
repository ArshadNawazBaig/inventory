import type { NotificationListQuery } from '@stockflow/types';
import type { NotificationEntity } from '../domain/entities';

/**
 * Persistence port for notifications. Always scoped to (tenant × recipient) — a user only ever sees their own
 * inbox. The Mongoose adapter implements the same port without touching the application.
 */
export interface NotificationRepository {
  insert(notification: NotificationEntity): Promise<NotificationEntity>;
  findById(organizationId: string, id: string): Promise<NotificationEntity | null>;
  list(
    organizationId: string,
    recipientId: string,
    query: NotificationListQuery,
  ): Promise<{ items: NotificationEntity[]; total: number }>;
  countUnread(organizationId: string, recipientId: string): Promise<number>;
  update(organizationId: string, id: string, patch: Partial<NotificationEntity>): Promise<NotificationEntity | null>;
  /** Marks every unread row for the recipient read at `readAt`; returns how many were updated. */
  markAllRead(organizationId: string, recipientId: string, readAt: Date): Promise<number>;
}

// ─── DI tokens (framework-agnostic symbols; wired in notifications.module.ts) ─────
export const NOTIFICATION_REPOSITORY = Symbol('NotificationRepository');
export const NOTIFICATION_ID_GENERATOR = Symbol('NotificationIdGenerator');
export const NOTIFICATION_CLOCK = Symbol('NotificationClock');
