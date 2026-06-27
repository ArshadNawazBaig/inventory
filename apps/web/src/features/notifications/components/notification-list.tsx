'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Button,
  Pagination,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  Skeleton,
  toast,
} from '@stockflow/ui';
import type { NotificationListQuery, NotificationResponse } from '@stockflow/types';
import { ErrorState } from '@/components/errors';
import { errorMessage } from '@/lib/api';
import { useNotifications, useUnreadCount } from '../queries';
import { useMarkAllNotificationsRead, useMarkNotificationRead } from '../mutations';
import { NotificationItem } from './notification-item';

const PAGE_SIZE = 20;
type StatusFilter = NotificationListQuery['status'];

export function NotificationList() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<StatusFilter>('all');
  const markRead = useMarkNotificationRead();
  const markAll = useMarkAllNotificationsRead();
  const unread = useUnreadCount();

  const query: NotificationListQuery = { page, limit: PAGE_SIZE, sort: '-createdAt', status };
  const { data, isLoading, isError, error, refetch } = useNotifications(query);
  const rows = data?.data ?? [];
  const meta = data?.meta.page;

  function onSelect(notification: NotificationResponse) {
    if (notification.readAt === null) markRead.mutate(notification.id);
    if (notification.link) router.push(notification.link);
  }

  async function runMarkAll() {
    try {
      const { updated } = await markAll.mutateAsync();
      toast.success(updated > 0 ? `Marked ${updated} read` : 'Nothing to mark');
    } catch (e) {
      toast.error(errorMessage(e));
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Notifications</h1>
          <p className="text-sm text-muted-foreground">Activity across your inventory, orders and transfers.</p>
        </div>
        <Button
          variant="outline"
          onClick={() => void runMarkAll()}
          loading={markAll.isPending}
          disabled={(unread.data?.count ?? 0) === 0}
        >
          Mark all read
        </Button>
      </header>

      <div className="flex items-center gap-3">
        <Select
          value={status}
          onValueChange={(value) => {
            setStatus(value as StatusFilter);
            setPage(1);
          }}
        >
          <SelectTrigger aria-label="Filter by status" className="w-44" placeholder="Status" />
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="unread">Unread</SelectItem>
            <SelectItem value="read">Read</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isError ? (
        <ErrorState
          title="Couldn’t load notifications"
          description={errorMessage(error)}
          onRetry={() => void refetch()}
        />
      ) : (
        <>
          <div className="overflow-hidden rounded-xl border border-border">
            {isLoading ? (
              <div className="divide-y divide-border">
                {Array.from({ length: 6 }, (_, row) => (
                  <div key={`skeleton-${row}`} className="p-3">
                    <Skeleton variant="text" className="max-w-[260px]" />
                  </div>
                ))}
              </div>
            ) : rows.length === 0 ? (
              <p className="p-10 text-center text-sm text-muted-foreground">No notifications.</p>
            ) : (
              <div className="divide-y divide-border">
                {rows.map((notification) => (
                  <NotificationItem key={notification.id} notification={notification} onSelect={onSelect} />
                ))}
              </div>
            )}
          </div>

          {meta && meta.total > 0 ? (
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-muted-foreground" aria-live="polite">
                {meta.total} {meta.total === 1 ? 'notification' : 'notifications'}
              </p>
              {meta.totalPages > 1 ? (
                <Pagination page={meta.page} pageCount={meta.totalPages} onPageChange={setPage} size="sm" />
              ) : null}
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}
