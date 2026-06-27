import { Badge, type BadgeTone } from '@stockflow/ui';
import type {
  PurchaseOrderStatus,
  ReturnStatus,
  SalesOrderStatus,
  TransferStatus,
} from '@stockflow/types';

type OrderStatus = PurchaseOrderStatus | SalesOrderStatus | TransferStatus | ReturnStatus;

const TONE: Record<OrderStatus, BadgeTone> = {
  draft: 'neutral',
  submitted: 'info',
  confirmed: 'info',
  in_transit: 'info',
  partially_received: 'warning',
  partially_fulfilled: 'warning',
  received: 'success',
  fulfilled: 'success',
  completed: 'success',
  cancelled: 'danger',
};

const LABEL: Record<OrderStatus, string> = {
  draft: 'Draft',
  submitted: 'Submitted',
  confirmed: 'Confirmed',
  in_transit: 'In transit',
  partially_received: 'Partially received',
  partially_fulfilled: 'Partially fulfilled',
  received: 'Received',
  fulfilled: 'Fulfilled',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

/** Status of a purchase/sales order, transfer or return (colour is a redundant cue; meaning is in the text). */
export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  return (
    <Badge tone={TONE[status]} dot>
      {LABEL[status]}
    </Badge>
  );
}
