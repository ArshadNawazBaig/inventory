import type { NotificationType } from '@stockflow/types';

/**
 * Notification domain entity. A **per-recipient** in-app inbox row: one user, one tenant, with read state
 * (`readAt`). `entityType`/`entityId`/`link` deep-link to the thing the notification is about. Framework-free.
 */
export interface NotificationEntity {
  id: string;
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
