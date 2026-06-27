import {
  type LucideIcon,
  NotificationIcon,
  ProductsIcon,
  PurchaseOrderIcon,
  ReturnIcon,
  SalesOrderIcon,
  TransferIcon,
} from '@stockflow/icons';
import type { NotificationType } from '@stockflow/types';

/** Pure presentation helpers for notifications (no React) so they're trivially unit-testable. */

const LABELS: Record<NotificationType, string> = {
  purchase_order: 'Purchase order',
  sales_order: 'Sales order',
  transfer: 'Transfer',
  return: 'Return',
  inventory: 'Inventory',
  system: 'System',
};

const ICONS: Record<NotificationType, LucideIcon> = {
  purchase_order: PurchaseOrderIcon,
  sales_order: SalesOrderIcon,
  transfer: TransferIcon,
  return: ReturnIcon,
  inventory: ProductsIcon,
  system: NotificationIcon,
};

export function notificationTypeLabel(type: NotificationType): string {
  return LABELS[type] ?? 'System';
}

export function notificationTypeIcon(type: NotificationType): LucideIcon {
  return ICONS[type] ?? NotificationIcon;
}

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

/** Compact relative time ("just now", "5m ago", "3h ago", "2d ago"); falls back to a date past a week. */
export function formatRelativeTime(iso: string, now: number): string {
  const then = Date.parse(iso);
  if (Number.isNaN(then)) return '';
  const diff = now - then;
  if (diff < MINUTE) return 'just now';
  if (diff < HOUR) return `${Math.floor(diff / MINUTE)}m ago`;
  if (diff < DAY) return `${Math.floor(diff / HOUR)}h ago`;
  if (diff < 7 * DAY) return `${Math.floor(diff / DAY)}d ago`;
  return new Date(then).toLocaleDateString();
}
