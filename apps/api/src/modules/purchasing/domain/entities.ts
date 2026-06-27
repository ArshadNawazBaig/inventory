import type { OrderTotals, PurchaseOrderStatus } from '@stockflow/types';

/**
 * Purchase Order domain entities (DATABASE §7). Lines are embedded and carry **snapshots** of the variant's
 * sku/name at order time (historical accuracy — renaming a product later must not rewrite a closed PO).
 * Framework-free.
 */
export interface PurchaseOrderLine {
  id: string;
  variantId: string;
  skuSnapshot: string;
  nameSnapshot: string;
  orderedQty: number;
  receivedQty: number;
  unitCostMinor: number;
}

export interface PurchaseOrderEntity {
  id: string;
  organizationId: string;
  poNumber: string;
  supplierId: string;
  supplierName: string | null;
  warehouseId: string;
  currency: string;
  status: PurchaseOrderStatus;
  expectedAt: string | null; // YYYY-MM-DD
  note: string | null;
  lines: PurchaseOrderLine[];
  totals: OrderTotals;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string | null;
  updatedBy: string | null;
}
