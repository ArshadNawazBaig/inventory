import type { SaleResponse } from '@stockflow/types';
import type { PosSaleEntity } from '../domain/entities';

/** Domain → response mapper; no entity leakage to clients. */
export function toSaleResponse(sale: PosSaleEntity): SaleResponse {
  return {
    id: sale.id,
    receiptNumber: sale.receiptNumber,
    locationId: sale.locationId,
    customerId: sale.customerId,
    currency: sale.currency,
    lines: sale.lines.map((line) => ({
      variantId: line.variantId,
      quantity: line.quantity,
      unitPriceMinor: line.unitPriceMinor,
      lineTotalMinor: line.lineTotalMinor,
    })),
    subtotalMinor: sale.subtotalMinor,
    totalMinor: sale.totalMinor,
    paymentMethod: sale.paymentMethod,
    amountTenderedMinor: sale.amountTenderedMinor,
    changeMinor: sale.changeMinor,
    soldByUserId: sale.soldByUserId,
    note: sale.note,
    createdAt: sale.createdAt.toISOString(),
  };
}
