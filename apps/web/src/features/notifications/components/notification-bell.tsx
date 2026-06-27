'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button, Popover, PopoverContent, PopoverTrigger } from '@stockflow/ui';
import { NotificationIcon } from '@stockflow/icons';
import type { NotificationResponse } from '@stockflow/types';
import { useNotifications, useUnreadCount } from '../queries';
import { useMarkAllNotificationsRead, useMarkNotificationRead } from '../mutations';
import { NotificationItem } from './notification-item';

/** Navbar bell — unread badge + a popover of the most recent notifications. */
export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const unread = useUnreadCount();
  const recent = useNotifications({ page: 1, limit: 8, sort: '-createdAt', status: 'all' });
  const markRead = useMarkNotificationRead();
  const markAll = useMarkAllNotificationsRead();

  const count = unread.data?.count ?? 0;
  const items = recent.data?.data ?? [];

  function onSelect(notification: NotificationResponse) {
    if (notification.readAt === null) markRead.mutate(notification.id);
    setOpen(false);
    if (notification.link) router.push(notification.link);
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          aria-label={count > 0 ? `Notifications, ${count} unread` : 'Notifications'}
        >
          <NotificationIcon className="size-5" aria-hidden="true" />
          {count > 0 ? (
            <span className="absolute -right-0.5 -top-0.5 flex min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold leading-4 text-primary-foreground">
              {count > 9 ? '9+' : count}
            </span>
          ) : null}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <header className="flex items-center justify-between border-b border-border p-3">
          <p className="text-sm font-semibold text-foreground">Notifications</p>
          {count > 0 ? (
            <button
              type="button"
              onClick={() => markAll.mutate()}
              className="text-xs text-primary hover:underline"
            >
              Mark all read
            </button>
          ) : null}
        </header>

        <div className="max-h-96 divide-y divide-border overflow-auto">
          {recent.isLoading ? (
            <p className="p-6 text-center text-sm text-muted-foreground">Loading…</p>
          ) : items.length === 0 ? (
            <p className="p-6 text-center text-sm text-muted-foreground">You’re all caught up.</p>
          ) : (
            items.map((notification) => (
              <NotificationItem key={notification.id} notification={notification} onSelect={onSelect} />
            ))
          )}
        </div>

        <footer className="border-t border-border p-2">
          <Link
            href="/notifications"
            onClick={() => setOpen(false)}
            className="block rounded-md p-2 text-center text-sm text-primary hover:bg-accent"
          >
            View all
          </Link>
        </footer>
      </PopoverContent>
    </Popover>
  );
}
