import {
  MarkAllReadResponseSchema,
  NotificationListResponseSchema,
  NotificationResponseSchema,
  UnreadCountResponseSchema,
  type MarkAllReadResponse,
  type NotificationListQuery,
  type NotificationListResponse,
  type NotificationResponse,
  type UnreadCountResponse,
} from '@stockflow/types';
import { apiRequest } from '@/lib/api';

const BASE = '/v1/notifications';

/** Notifications REST bindings (scoped server-side to the current user). Responses validated against contracts. */
export function listNotifications(
  query: NotificationListQuery,
  signal?: AbortSignal,
): Promise<NotificationListResponse> {
  return apiRequest(BASE, {
    query: { page: query.page, limit: query.limit, sort: query.sort, status: query.status, type: query.type },
    schema: NotificationListResponseSchema,
    ...(signal ? { signal } : {}),
  });
}

export function getUnreadCount(signal?: AbortSignal): Promise<UnreadCountResponse> {
  return apiRequest(`${BASE}/unread-count`, {
    schema: UnreadCountResponseSchema,
    ...(signal ? { signal } : {}),
  });
}

export function markNotificationRead(id: string): Promise<NotificationResponse> {
  return apiRequest(`${BASE}/${id}/read`, { method: 'POST', schema: NotificationResponseSchema });
}

export function markAllNotificationsRead(): Promise<MarkAllReadResponse> {
  return apiRequest(`${BASE}/read-all`, { method: 'POST', schema: MarkAllReadResponseSchema });
}
