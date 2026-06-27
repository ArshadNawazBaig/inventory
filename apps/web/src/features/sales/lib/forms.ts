import type { CreateSalesOrderRequest } from '@stockflow/types';
import { toLineCore, type OrderFormValues } from '@/features/orders/lib/order-form';

/** Map the shared order-form values to a Create SO request (unit money → `unitPriceMinor`; no expectedAt). */
export function toCreateSalesOrder(values: OrderFormValues): CreateSalesOrderRequest {
  const request: CreateSalesOrderRequest = {
    customerId: values.partyId,
    warehouseId: values.warehouseId,
    currency: values.currency.trim().toUpperCase(),
    lines: values.lines.map((line) => {
      const core = toLineCore(line);
      return { variantId: core.variantId, orderedQty: core.orderedQty, unitPriceMinor: core.unitMinor };
    }),
  };
  if (values.note.trim()) request.note = values.note.trim();
  return request;
}
