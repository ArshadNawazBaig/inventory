import { z } from 'zod';
import { PageMetaSchema } from './catalog';

/**
 * Reports contracts — the single source of truth for validation AND types, shared by API + worker + web. See
 * docs/modules/reports.md. Reports are read-only, cross-module aggregations over the inventory projection +
 * catalog. Computed synchronously for now; async generation + CSV export via BullMQ is a documented follow-up.
 * Money is integer minor units throughout.
 */

// ─── Permissions ───────────────────────────────────────────────────────────────
export const REPORT_PERMISSIONS = { view: 'report.view', export: 'report.export' } as const;
export type ReportPermission = (typeof REPORT_PERMISSIONS)[keyof typeof REPORT_PERMISSIONS];

const objectId = z.string().regex(/^[a-fA-F0-9]{24}$/, 'Must be a 24-character hex id');

// ─── Inventory valuation ─────────────────────────────────────────────────────
/** Optional warehouse scope for the valuation report. */
export const InventoryValuationQuerySchema = z
  .object({ warehouseId: objectId.optional() })
  .strict();
export type InventoryValuationQuery = z.infer<typeof InventoryValuationQuerySchema>;

export const InventoryValuationTotalsSchema = z.object({
  totalUnits: z.number().int(),
  totalValueMinor: z.number().int(),
  variantCount: z.number().int(),
  cellCount: z.number().int(),
});
export type InventoryValuationTotals = z.infer<typeof InventoryValuationTotalsSchema>;

export const WarehouseValuationSchema = z.object({
  warehouseId: z.string(),
  warehouseName: z.string().nullable(),
  units: z.number().int(),
  valueMinor: z.number().int(),
});
export type WarehouseValuation = z.infer<typeof WarehouseValuationSchema>;

/** Stock valued at the weighted-average cost of each (variant × location) cell. */
export const InventoryValuationResponseSchema = z.object({
  totals: InventoryValuationTotalsSchema,
  byWarehouse: z.array(WarehouseValuationSchema),
  currency: z.string().nullable(),
});
export type InventoryValuationResponse = z.infer<typeof InventoryValuationResponseSchema>;

// ─── Low stock (reorder) ──────────────────────────────────────────────────────
export const LowStockListQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
  })
  .strict();
export type LowStockListQuery = z.infer<typeof LowStockListQuerySchema>;

export const LowStockRowSchema = z.object({
  variantId: z.string(),
  sku: z.string(),
  productName: z.string(),
  onHand: z.number().int(),
  reorderPoint: z.number().int(),
  reorderQty: z.number().int(),
  /** How much to order to clear the shortfall (≥ reorderQty when set). */
  suggestedQty: z.number().int(),
});
export type LowStockRow = z.infer<typeof LowStockRowSchema>;

export const LowStockResponseSchema = z.object({
  data: z.array(LowStockRowSchema),
  meta: PageMetaSchema,
});
export type LowStockResponse = z.infer<typeof LowStockResponseSchema>;
