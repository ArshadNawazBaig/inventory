import { z } from 'zod';
import { PageMetaSchema } from './catalog';

/**
 * Inventory contracts (the keystone) — the single source of truth for validation AND types, shared by
 * API + worker + web. See docs/modules/inventory.md and DATABASE §6. The immutable **ledger**
 * (`stock_movements`) is the source of truth; **stock levels** are a persisted projection
 * (`onHand ≡ Σ delta`, `available = onHand − reserved`). Only the Inventory module writes the ledger.
 */

// ─── Permissions ───────────────────────────────────────────────────────────────
export const INVENTORY_PERMISSIONS = { view: 'inventory.view', adjust: 'inventory.adjust' } as const;
export type InventoryPermission = (typeof INVENTORY_PERMISSIONS)[keyof typeof INVENTORY_PERMISSIONS];

// ─── Enums ───────────────────────────────────────────────────────────────────
/** Reason class for a ledger movement (DATABASE §6.1). Manual adjustments use `adjustment`; the others
 * are posted by their owning modules (PO receipt, SO shipment, transfers, counts, returns). */
export const STOCK_MOVEMENT_TYPES = [
  'receipt',
  'shipment',
  'adjustment',
  'transfer_out',
  'transfer_in',
  'count_adjustment',
  'return_in',
  'return_out',
  'scrap',
] as const;
export type StockMovementType = (typeof STOCK_MOVEMENT_TYPES)[number];

/** Source of a movement — links the ledger entry back to the document that caused it. */
export const MOVEMENT_REASON_KINDS = [
  'purchase_order',
  'sales_order',
  'pos_sale',
  'transfer',
  'return',
  'count',
  'manual',
] as const;
export type MovementReasonKind = (typeof MOVEMENT_REASON_KINDS)[number];

// ─── Reusable field schemas ──────────────────────────────────────────────────
const objectId = z.string().regex(/^[a-fA-F0-9]{24}$/, 'Must be a 24-character hex id');
const currencyField = z.string().regex(/^[A-Z]{3}$/, 'ISO-4217 currency code');

// ─── Adjustment (the manual ledger write) ────────────────────────────────────
/**
 * Post a manual stock adjustment — a signed `delta` against one (variant, location). A positive delta may
 * carry an inbound `unitCostMinor` (drives weighted-average valuation). `opKey` is an idempotency key:
 * re-posting the same key returns the original movement instead of double-posting (DATABASE §11).
 */
export const CreateAdjustmentRequestSchema = z
  .object({
    variantId: objectId,
    locationId: objectId,
    delta: z.number().int(),
    note: z.string().trim().max(500).optional(),
    unitCostMinor: z.number().int().min(0).optional(),
    currency: currencyField.optional(),
    opKey: z.string().trim().min(1).max(120).optional(),
  })
  .strict();
export type CreateAdjustmentRequest = z.infer<typeof CreateAdjustmentRequestSchema>;

// ─── Responses ───────────────────────────────────────────────────────────────
export const MovementReasonSchema = z.object({
  kind: z.enum(MOVEMENT_REASON_KINDS),
  refId: z.string().nullable(),
  lineId: z.string().nullable(),
});
export type MovementReason = z.infer<typeof MovementReasonSchema>;

export const StockMovementResponseSchema = z.object({
  id: z.string(),
  variantId: z.string(),
  locationId: z.string(),
  delta: z.number().int(),
  type: z.enum(STOCK_MOVEMENT_TYPES),
  reason: MovementReasonSchema,
  unitCostMinor: z.number().int().nullable(),
  currency: z.string().nullable(),
  note: z.string().nullable(),
  opKey: z.string(),
  createdAt: z.string(),
  createdBy: z.string().nullable(),
});
export type StockMovementResponse = z.infer<typeof StockMovementResponseSchema>;

export const StockLevelResponseSchema = z.object({
  variantId: z.string(),
  locationId: z.string(),
  onHand: z.number().int(),
  reserved: z.number().int(),
  available: z.number().int(),
  inTransit: z.number().int(),
  avgCostMinor: z.number().int().nullable(),
  currency: z.string().nullable(),
  lastMovementAt: z.string().nullable(),
  updatedAt: z.string(),
});
export type StockLevelResponse = z.infer<typeof StockLevelResponseSchema>;

/** An adjustment returns both the appended ledger entry and the resulting projection (one round-trip). */
export const AdjustmentResultSchema = z.object({
  movement: StockMovementResponseSchema,
  level: StockLevelResponseSchema,
});
export type AdjustmentResult = z.infer<typeof AdjustmentResultSchema>;

export const StockLevelListResponseSchema = z.object({
  data: z.array(StockLevelResponseSchema),
  meta: PageMetaSchema,
});
export type StockLevelListResponse = z.infer<typeof StockLevelListResponseSchema>;

export const StockMovementListResponseSchema = z.object({
  data: z.array(StockMovementResponseSchema),
  meta: PageMetaSchema,
});
export type StockMovementListResponse = z.infer<typeof StockMovementListResponseSchema>;

// ─── List queries ──────────────────────────────────────────────────────────────
export const StockLevelListQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    sort: z
      .enum(['onHand', '-onHand', 'available', '-available', 'updatedAt', '-updatedAt'])
      .default('-updatedAt'),
    variantId: objectId.optional(),
    locationId: objectId.optional(),
  })
  .strict();
export type StockLevelListQuery = z.infer<typeof StockLevelListQuerySchema>;

export const StockMovementListQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    sort: z.enum(['createdAt', '-createdAt']).default('-createdAt'),
    variantId: objectId.optional(),
    locationId: objectId.optional(),
    type: z.enum(STOCK_MOVEMENT_TYPES).optional(),
  })
  .strict();
export type StockMovementListQuery = z.infer<typeof StockMovementListQuerySchema>;
