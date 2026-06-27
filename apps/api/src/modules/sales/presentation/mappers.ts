import type { SalesOrderResponse, SalesOrderSummary } from '@stockflow/types';
import type { SalesOrderEntity, SalesOrderLine } from '../domain/entities';

function lineResponse(line: SalesOrderLine) {
  return {
    id: line.id,
    variantId: line.variantId,
    skuSnapshot: line.skuSnapshot,
    nameSnapshot: line.nameSnapshot,
    orderedQty: line.orderedQty,
    shippedQty: line.shippedQty,
    unitPriceMinor: line.unitPriceMinor,
  };
}

function base(order: SalesOrderEntity) {
  return {
    id: order.id,
    soNumber: order.soNumber,
    customerId: order.customerId,
    customerName: order.customerName,
    warehouseId: order.warehouseId,
    currency: order.currency,
    status: order.status,
    totals: order.totals,
    createdAt: order.createdAt.toISOString(),
    updatedAt: order.updatedAt.toISOString(),
  };
}

/** Detail — full order with embedded lines + note. */
export function toSalesOrderResponse(order: SalesOrderEntity): SalesOrderResponse {
  return { ...base(order), note: order.note, lines: order.lines.map(lineResponse) };
}

/** List item — omits lines; carries `lineCount`. */
export function toSalesOrderSummary(order: SalesOrderEntity): SalesOrderSummary {
  return { ...base(order), lineCount: order.lines.length };
}
