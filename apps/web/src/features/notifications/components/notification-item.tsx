'use client';

import { cn } from '@stockflow/ui';
import type { NotificationResponse } from '@stockflow/types';
import { formatRelativeTime, notificationTypeIcon } from '../lib/notify-format';

export interface NotificationItemProps {
  notification: NotificationResponse;
  onSelect: (notification: NotificationResponse) => void;
}

/** One inbox row — icon, title, body, relative time, unread dot. Clickable (marks read + deep-links). */
export function NotificationItem({ notification, onSelect }: NotificationItemProps) {
  const Icon = notificationTypeIcon(notification.type);
  const unread = notification.readAt === null;

  return (
    <button
      type="button"
      onClick={() => onSelect(notification)}
      className={cn(
        'flex w-full gap-3 p-3 text-left transition-colors hover:bg-accent focus-visible:bg-accent focus-visible:outline-none',
        unread && 'bg-primary/5',
      )}
    >
      <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <Icon className="size-4" aria-hidden="true" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center justify-between gap-2">
          <span className="truncate text-sm font-medium text-foreground">{notification.title}</span>
          {unread ? (
            <span className="size-2 shrink-0 rounded-full bg-primary" aria-label="Unread" />
          ) : null}
        </span>
        <span className="mt-0.5 line-clamp-2 block text-sm text-muted-foreground">{notification.body}</span>
        <span className="mt-1 block text-xs text-muted-foreground">
          {formatRelativeTime(notification.createdAt, Date.now())}
        </span>
      </span>
    </button>
  );
}
