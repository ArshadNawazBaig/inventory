import type { NotificationListQuery } from '@stockflow/types';

/** TanStack Query keys for Notifications. Mutations invalidate `all` (lists + unread count). */
export const notificationKeys = {
  all: ['notifications'] as const,
  list: (query: NotificationListQuery) => ['notifications', 'list', query] as const,
  unreadCount: () => ['notifications', 'unread-count'] as const,
};
