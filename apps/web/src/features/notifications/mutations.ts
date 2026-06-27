'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { MarkAllReadResponse, NotificationResponse } from '@stockflow/types';
import { markAllNotificationsRead, markNotificationRead } from './api';
import { notificationKeys } from './query-keys';

/** Notification mutations — they own cache invalidation only (navigation/toasts live in components). */
export function useMarkNotificationRead() {
  const qc = useQueryClient();
  return useMutation<NotificationResponse, Error, string>({
    mutationFn: (id) => markNotificationRead(id),
    onSuccess: () => void qc.invalidateQueries({ queryKey: notificationKeys.all }),
  });
}

export function useMarkAllNotificationsRead() {
  const qc = useQueryClient();
  return useMutation<MarkAllReadResponse, Error, void>({
    mutationFn: () => markAllNotificationsRead(),
    onSuccess: () => void qc.invalidateQueries({ queryKey: notificationKeys.all }),
  });
}
