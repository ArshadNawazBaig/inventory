import { z } from 'zod';
import { STOCK_MOVEMENT_TYPES, MOVEMENT_REASON_KINDS } from './inventory';
import { LowStockRowSchema, WarehouseValuationSchema } from './reports';

/**
 * Dashboard contracts — the single source of truth for validation AND types, shared by API + worker + web.
 * See docs/modules/dashboard.md. The dashboard is a read-only **overview**: it composes existing read-models
 * (Reports valuation + low-stock, order status counts, the inventory ledger feed) into one payload. It owns no
 * collection and writes nothing. Money is integer minor units throughout.
 */

// ─── Permissions ───────────────────────────────────────────────────────────────
export const DASHBOARD_PERMISSIONS = { view: 'dashboard.view' } as const;
export type DashboardPermission = (typeof DASHBOARD_PERMISSIONS)[keyof typeof DASHBOARD_PERMISSIONS];

// ─── Headline inventory block ────────────────────────────────────────────────
export const DashboardInventorySchema = z.object({
  totalValueMinor: z.number().int(),
  totalUnits: z.number().int(),
  variantCount: z.number().int(),
  currency: z.string().nullable(),
});
export type DashboardInventory = z.infer<typeof DashboardInventorySchema>;

// ─── Headline counts (the KPI tiles) ─────────────────────────────────────────
export const DashboardCountsSchema = z.object({
  lowStock: z.number().int(),
  openPurchaseOrders: z.number().int(),
  openSalesOrders: z.number().int(),
  inTransitTransfers: z.number().int(),
});
export type DashboardCounts = z.infer<typeof DashboardCountsSchema>;

// ─── Order status breakdowns ─────────────────────────────────────────────────
/** A `{ status, count }` tally; the API returns the complete set (count 0 for absent statuses). */
export const StatusCountSchema = z.object({ status: z.string(), count: z.number().int() });
export type StatusCount = z.infer<typeof StatusCountSchema>;

export const DashboardOrdersByStatusSchema = z.object({
  purchaseOrders: z.array(StatusCountSchema),
  salesOrders: z.array(StatusCountSchema),
  transfers: z.array(StatusCountSchema),
});
export type DashboardOrdersByStatus = z.infer<typeof DashboardOrdersByStatusSchema>;

// ─── Recent ledger activity feed ──────────────────────────────────────────────
/** A recent stock movement, enriched with the variant sku/name + location label for display. */
export const RecentMovementSchema = z.object({
  id: z.string(),
  type: z.enum(STOCK_MOVEMENT_TYPES),
  reasonKind: z.enum(MOVEMENT_REASON_KINDS),
  delta: z.number().int(),
  variantId: z.string(),
  sku: z.string(),
  productName: z.string(),
  locationId: z.string(),
  locationName: z.string().nullable(),
  createdAt: z.string(),
});
export type RecentMovement = z.infer<typeof RecentMovementSchema>;

// ─── The summary payload ─────────────────────────────────────────────────────
/** Everything the overview page renders, in one round-trip. */
export const DashboardSummaryResponseSchema = z.object({
  inventory: DashboardInventorySchema,
  counts: DashboardCountsSchema,
  valuationByWarehouse: z.array(WarehouseValuationSchema),
  ordersByStatus: DashboardOrdersByStatusSchema,
  topLowStock: z.array(LowStockRowSchema),
  recentMovements: z.array(RecentMovementSchema),
});
export type DashboardSummaryResponse = z.infer<typeof DashboardSummaryResponseSchema>;
