import type { CreatePurchaseOrderRequest } from '@stockflow/types';
import { toLineCore, type OrderFormValues } from '@/features/orders/lib/order-form';

/** Map the shared order-form values to a Create PO request (unit money → `unitCostMinor`). */
export function toCreatePurchaseOrder(values: OrderFormValues): CreatePurchaseOrderRequest {
  const request: CreatePurchaseOrderRequest = {
    supplierId: values.partyId,
    warehouseId: values.warehouseId,
    currency: values.currency.trim().toUpperCase(),
    lines: values.lines.map((line) => {
      const core = toLineCore(line);
      return { variantId: core.variantId, orderedQty: core.orderedQty, unitCostMinor: core.unitMinor };
    }),
  };
  if (values.expectedAt.trim()) request.expectedAt = values.expectedAt.trim();
  if (values.note.trim()) request.note = values.note.trim();
  return request;
}
