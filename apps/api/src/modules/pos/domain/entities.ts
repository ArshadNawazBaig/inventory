import type { PaymentMethod } from '@stockflow/types';

/**
 * Point-of-Sale domain entities (framework-free). A **sale** is an immutable retail receipt: priced lines sold
 * from a store location, the payment taken, and who sold it. Stock leaves via Inventory `shipment` movements
 * (reason `pos_sale`) — the sale row is the receipt, the ledger is the stock truth.
 */

export interface PosSaleLine {
  variantId: string;
  quantity: number;
  unitPriceMinor: number;
  lineTotalMinor: number;
}

export interface PosSaleEntity {
  id: string;
  organizationId: string;
  receiptNumber: string;
  locationId: string;
  customerId: string | null;
  currency: string;
  lines: PosSaleLine[];
  subtotalMinor: number;
  totalMinor: number;
  paymentMethod: PaymentMethod;
  amountTenderedMinor: number;
  changeMinor: number;
  soldByUserId: string | null;
  note: string | null;
  createdAt: Date;
}
