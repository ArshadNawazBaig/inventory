import { Badge, type BadgeTone } from '@stockflow/ui';
import type { PurchaseOrderStatus, SalesOrderStatus } from '@stockflow/types';

type OrderStatus = PurchaseOrderStatus | SalesOrderStatus;

const TONE: Record<OrderStatus, BadgeTone> = {
  draft: 'neutral',
  submitted: 'info',
  confirmed: 'info',
  partially_received: 'warning',
  partially_fulfilled: 'warning',
  received: 'success',
  fulfilled: 'success',
  cancelled: 'danger',
};

const LABEL: Record<OrderStatus, string> = {
  draft: 'Draft',
  submitted: 'Submitted',
  confirmed: 'Confirmed',
  partially_received: 'Partially received',
  partially_fulfilled: 'Partially fulfilled',
  received: 'Received',
  fulfilled: 'Fulfilled',
  cancelled: 'Cancelled',
};

/** Status of a purchase or sales order (colour is a redundant cue; meaning is in the text). */
export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  return (
    <Badge tone={TONE[status]} dot>
      {LABEL[status]}
    </Badge>
  );
}
