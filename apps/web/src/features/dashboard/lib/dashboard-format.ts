import {
  AdjustmentIcon,
  CountIcon,
  type LucideIcon,
  ProductsIcon,
  PurchaseOrderIcon,
  ReturnIcon,
  SalesOrderIcon,
  TransferIcon,
} from '@stockflow/icons';
import type { MovementReasonKind, StockMovementType } from '@stockflow/types';

/** Pure presentation helpers for the dashboard (no React) so they're trivially unit-testable. */

const REASON_ICONS: Record<MovementReasonKind, LucideIcon> = {
  purchase_order: PurchaseOrderIcon,
  sales_order: SalesOrderIcon,
  transfer: TransferIcon,
  return: ReturnIcon,
  count: CountIcon,
  manual: AdjustmentIcon,
};

/** The icon for a movement's source (falls back to the generic stock glyph). */
export function movementReasonIcon(kind: MovementReasonKind): LucideIcon {
  return REASON_ICONS[kind] ?? ProductsIcon;
}

const TYPE_LABELS: Record<StockMovementType, string> = {
  receipt: 'Received',
  shipment: 'Shipped',
  adjustment: 'Adjusted',
  transfer_out: 'Transferred out',
  transfer_in: 'Transferred in',
  count_adjustment: 'Count adjusted',
  return_in: 'Returned in',
  return_out: 'Returned out',
  scrap: 'Scrapped',
};

/** A human label for a movement type ("transfer_out" → "Transferred out"). */
export function movementTypeLabel(type: StockMovementType): string {
  return TYPE_LABELS[type] ?? type;
}

/** A signed quantity for display (positive deltas get a leading "+"). */
export function formatDelta(delta: number): string {
  return delta > 0 ? `+${delta}` : `${delta}`;
}

/** snake_case status → Title Case ("partially_received" → "Partially Received"). */
export function humanizeStatus(status: string): string {
  return status
    .split('_')
    .map((word) => (word ? word[0]!.toUpperCase() + word.slice(1) : word))
    .join(' ');
}
