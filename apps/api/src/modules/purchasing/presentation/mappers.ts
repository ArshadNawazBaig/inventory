import type { PurchaseOrderResponse, PurchaseOrderSummary } from '@stockflow/types';
import type { PurchaseOrderEntity, PurchaseOrderLine } from '../domain/entities';

function lineResponse(line: PurchaseOrderLine) {
  return {
    id: line.id,
    variantId: line.variantId,
    skuSnapshot: line.skuSnapshot,
    nameSnapshot: line.nameSnapshot,
    orderedQty: line.orderedQty,
    receivedQty: line.receivedQty,
    unitCostMinor: line.unitCostMinor,
  };
}

function base(order: PurchaseOrderEntity) {
  return {
    id: order.id,
    poNumber: order.poNumber,
    supplierId: order.supplierId,
    supplierName: order.supplierName,
    warehouseId: order.warehouseId,
    currency: order.currency,
    status: order.status,
    expectedAt: order.expectedAt,
    totals: order.totals,
    createdAt: order.createdAt.toISOString(),
    updatedAt: order.updatedAt.toISOString(),
  };
}

/** Detail — full order with embedded lines + note. */
export function toPurchaseOrderResponse(order: PurchaseOrderEntity): PurchaseOrderResponse {
  return { ...base(order), note: order.note, lines: order.lines.map(lineResponse) };
}

/** List item — omits lines; carries `lineCount`. */
export function toPurchaseOrderSummary(order: PurchaseOrderEntity): PurchaseOrderSummary {
  return { ...base(order), lineCount: order.lines.length };
}
