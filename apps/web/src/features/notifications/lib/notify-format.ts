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

// Re-exported from the shared time util so existing importers keep working (single source of truth).
export { formatRelativeTime } from '@/lib/time';

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
