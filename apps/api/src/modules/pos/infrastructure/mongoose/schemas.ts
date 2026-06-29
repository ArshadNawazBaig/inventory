import { Schema } from 'mongoose';
import type { PaymentMethod } from '@stockflow/types';
import type { PosSaleLine } from '../../domain/entities';

/**
 * Mongoose schema for POS sales (the receipt store). `_id` is the service-generated id; lines are embedded
 * (`Mixed` array). `versionKey` off. Receipt numbers are minted from the shared `counters` collection.
 */

export const POS_SALE_MODEL = 'PosSale';

export interface PosSaleDoc {
  _id: string;
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

// Untyped Schema: embedded Mixed line array (the strict generic rejects Mixed arrays).
export const PosSaleSchema = new Schema(
  {
    _id: { type: String },
    organizationId: { type: String, required: true },
    receiptNumber: { type: String, required: true },
    locationId: { type: String, required: true },
    customerId: { type: String, default: null },
    currency: { type: String, required: true },
    lines: { type: [Schema.Types.Mixed], default: [] },
    subtotalMinor: { type: Number, required: true },
    totalMinor: { type: Number, required: true },
    paymentMethod: { type: String, required: true },
    amountTenderedMinor: { type: Number, required: true },
    changeMinor: { type: Number, required: true },
    soldByUserId: { type: String, default: null },
    note: { type: String, default: null },
    createdAt: { type: Date, required: true },
  },
  { collection: 'pos_sales', versionKey: false },
);
PosSaleSchema.index({ organizationId: 1, createdAt: -1 });
PosSaleSchema.index({ organizationId: 1, locationId: 1, createdAt: -1 });
