import type { NotificationResponse } from '@stockflow/types';
import type { NotificationEntity } from '../domain/entities';

/** Map a notification entity to its API response (recipient/tenant are implicit; never exposed). */
export function toNotificationResponse(n: NotificationEntity): NotificationResponse {
  return {
    id: n.id,
    type: n.type,
    title: n.title,
    body: n.body,
    entityType: n.entityType,
    entityId: n.entityId,
    link: n.link,
    readAt: n.readAt ? n.readAt.toISOString() : null,
    createdAt: n.createdAt.toISOString(),
  };
}
