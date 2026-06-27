'use client';

import { keepPreviousData, useQuery } from '@tanstack/react-query';
import type { NotificationListQuery } from '@stockflow/types';
import { getUnreadCount, listNotifications } from './api';
import { notificationKeys } from './query-keys';

/** Paginated/filtered notification list for the current user. */
export function useNotifications(query: NotificationListQuery) {
  return useQuery({
    queryKey: notificationKeys.list(query),
    queryFn: ({ signal }) => listNotifications(query, signal),
    placeholderData: keepPreviousData,
  });
}

/** Unread badge count — polled so the navbar bell stays fresh without a realtime channel (a follow-up). */
export function useUnreadCount() {
  return useQuery({
    queryKey: notificationKeys.unreadCount(),
    queryFn: ({ signal }) => getUnreadCount(signal),
    refetchInterval: 30_000,
    refetchOnWindowFocus: true,
  });
}
