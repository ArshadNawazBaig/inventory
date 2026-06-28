import { Schema } from 'mongoose';
import type { StockMovementType } from '@stockflow/types';
import type { MovementReason } from '../../domain/entities';

/**
 * Mongoose schemas for the Inventory keystone.
 * - **`stock_movements`** is the append-only ledger: `_id` = the service-generated movement id; a unique
 *   `{ organizationId, opKey }` index is the database-level idempotency guard.
 * - **`stock_levels`** is the projection (one per variant×location): `_id` is the composite
 *   `"{org}:{variant}:{location}"` so an upsert is a single keyed write.
 * Both are written together by the ledger writer inside one transaction (DATABASE §6, §11).
 */

export const MOVEMENT_MODEL = 'StockMovement';
export const LEVEL_MODEL = 'StockLevel';

/** The projection document key — composite so the upsert targets exactly one cell. */
export function levelKey(organizationId: string, variantId: string, locationId: string): string {
  return `${organizationId}:${variantId}:${locationId}`;
}

export interface StockMovementDoc {
  _id: string;
  organizationId: string;
  variantId: string;
  locationId: string;
  delta: number;
  type: StockMovementType;
  reason: MovementReason;
  unitCostMinor: number | null;
  currency: string | null;
  note: string | null;
  opKey: string;
  createdAt: Date;
  createdBy: string | null;
}

export interface StockLevelDoc {
  _id: string;
  organizationId: string;
  variantId: string;
  locationId: string;
  onHand: number;
  reserved: number;
  available: number;
  inTransit: number;
  avgCostMinor: number | null;
  currency: string | null;
  lastMovementAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

// Untyped (reason is a Mixed sub-object); document typing is enforced at the model boundary.
export const StockMovementSchema = new Schema(
  {
    _id: { type: String },
    organizationId: { type: String, required: true },
    variantId: { type: String, required: true },
    locationId: { type: String, required: true },
    delta: { type: Number, required: true },
    type: { type: String, required: true },
    reason: { type: Object, required: true },
    unitCostMinor: { type: Number, default: null },
    currency: { type: String, default: null },
    note: { type: String, default: null },
    opKey: { type: String, required: true },
    createdAt: { type: Date, required: true },
    createdBy: { type: String, default: null },
  },
  { collection: 'stock_movements', versionKey: false },
);
// Idempotency guard: a tenant can never have two movements with the same opKey.
StockMovementSchema.index({ organizationId: 1, opKey: 1 }, { unique: true });
StockMovementSchema.index({ organizationId: 1, variantId: 1, locationId: 1 });
StockMovementSchema.index({ organizationId: 1, createdAt: 1 });

export const StockLevelSchema = new Schema<StockLevelDoc>(
  {
    _id: { type: String },
    organizationId: { type: String, required: true },
    variantId: { type: String, required: true },
    locationId: { type: String, required: true },
    onHand: { type: Number, required: true },
    reserved: { type: Number, required: true },
    available: { type: Number, required: true },
    inTransit: { type: Number, required: true },
    avgCostMinor: { type: Number, default: null },
    currency: { type: String, default: null },
    lastMovementAt: { type: Date, default: null },
    createdAt: { type: Date, required: true },
    updatedAt: { type: Date, required: true },
  },
  { collection: 'stock_levels', versionKey: false },
);
StockLevelSchema.index({ organizationId: 1, variantId: 1, locationId: 1 }, { unique: true });
StockLevelSchema.index({ organizationId: 1, onHand: 1 });
StockLevelSchema.index({ organizationId: 1, updatedAt: 1 });
