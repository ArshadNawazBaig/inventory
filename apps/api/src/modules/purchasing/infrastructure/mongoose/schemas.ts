import { Schema } from 'mongoose';
import type { OrderTotals, PurchaseOrderStatus } from '@stockflow/types';
import type { PurchaseOrderLine } from '../../domain/entities';

/**
 * Mongoose schema for purchase orders. `_id` is the service-generated 24-hex string; embedded `lines` + the
 * `totals` rollup are stored as Mixed (opaque snapshots — the service owns their shape, validated by Zod at
 * the edge). Document numbers are minted from the shared `counters` collection.
 */
export const PURCHASE_ORDER_MODEL = 'PurchaseOrder';

export interface PurchaseOrderDoc {
  _id: string;
  organizationId: string;
  poNumber: string;
  supplierId: string;
  supplierName: string | null;
  warehouseId: string;
  currency: string;
  status: PurchaseOrderStatus;
  expectedAt: string | null;
  note: string | null;
  lines: PurchaseOrderLine[];
  totals: OrderTotals;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string | null;
  updatedBy: string | null;
}

// Schema is left untyped (no generic): embedded Mixed arrays don't satisfy the strict typed-schema
// definition. Document typing is enforced at the model boundary (`Model<PurchaseOrderDoc>` via @InjectModel).
export const PurchaseOrderSchema = new Schema(
  {
    _id: { type: String },
    organizationId: { type: String, required: true },
    poNumber: { type: String, required: true },
    supplierId: { type: String, required: true },
    supplierName: { type: String, default: null },
    warehouseId: { type: String, required: true },
    currency: { type: String, required: true },
    status: { type: String, required: true },
    expectedAt: { type: String, default: null },
    note: { type: String, default: null },
    lines: { type: [Schema.Types.Mixed], default: [] },
    totals: { type: Schema.Types.Mixed, required: true },
    createdAt: { type: Date, required: true },
    updatedAt: { type: Date, required: true },
    createdBy: { type: String, default: null },
    updatedBy: { type: String, default: null },
  },
  { collection: 'purchase_orders', versionKey: false },
);
PurchaseOrderSchema.index({ organizationId: 1, status: 1 });
PurchaseOrderSchema.index({ organizationId: 1, poNumber: 1 });
