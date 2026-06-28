import { Schema } from 'mongoose';
import type { OrderTotals, SalesOrderStatus } from '@stockflow/types';
import type { SalesOrderLine } from '../../domain/entities';

/** Mongoose schema for sales orders. `_id` = service-generated id; embedded `lines` + `totals` are Mixed. */
export const SALES_ORDER_MODEL = 'SalesOrder';

export interface SalesOrderDoc {
  _id: string;
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

// Untyped schema (embedded Mixed arrays); document typing is enforced at the model boundary.
export const SalesOrderSchema = new Schema(
  {
    _id: { type: String },
    organizationId: { type: String, required: true },
    soNumber: { type: String, required: true },
    customerId: { type: String, required: true },
    customerName: { type: String, default: null },
    warehouseId: { type: String, required: true },
    currency: { type: String, required: true },
    status: { type: String, required: true },
    note: { type: String, default: null },
    lines: { type: [Schema.Types.Mixed], default: [] },
    totals: { type: Schema.Types.Mixed, required: true },
    createdAt: { type: Date, required: true },
    updatedAt: { type: Date, required: true },
    createdBy: { type: String, default: null },
    updatedBy: { type: String, default: null },
  },
  { collection: 'sales_orders', versionKey: false },
);
SalesOrderSchema.index({ organizationId: 1, status: 1 });
SalesOrderSchema.index({ organizationId: 1, soNumber: 1 });
