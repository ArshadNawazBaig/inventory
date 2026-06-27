import type { OrderTotals, SalesOrderStatus } from '@stockflow/types';

/**
 * Sales Order domain entities (DATABASE §8). Lines are embedded and carry **snapshots** of the variant's
 * sku/name + price at order time (historical accuracy). Framework-free.
 */
export interface SalesOrderLine {
  id: string;
  variantId: string;
  skuSnapshot: string;
  nameSnapshot: string;
  orderedQty: number;
  shippedQty: number;
  unitPriceMinor: number;
}

export interface SalesOrderEntity {
  id: string;
  organizationId: string;
  soNumber: string;
  customerId: string;
  customerName: string | null;
  warehouseId: string;
  currency: string;
  status: SalesOrderStatus;
  note: string | null;
  lines: SalesOrderLine[];
  totals: OrderTotals;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string | null;
  updatedBy: string | null;
}
