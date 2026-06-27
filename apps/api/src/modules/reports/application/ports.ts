/**
 * Read-only ports the Reports module aggregates over. Each structurally matches a query service it binds to
 * (InventoryQuery / CatalogQuery / LocationQuery) — Reports depends one-way on those modules; no writes, no
 * cycles.
 */

/** A flattened (variant × location) projection row from Inventory. */
export interface StockLevelRow {
  variantId: string;
  locationId: string;
  onHand: number;
  avgCostMinor: number | null;
  currency: string | null;
}

export interface InventoryReadPort {
  listAllLevels(organizationId: string): Promise<StockLevelRow[]>;
}

/** A reorder-eligible variant (reorderPoint > 0) joined with its product name. */
export interface ReorderVariant {
  variantId: string;
  sku: string;
  productName: string;
  reorderPoint: number;
  reorderQty: number;
}

export interface CatalogReadPort {
  listReorderVariants(organizationId: string): Promise<ReorderVariant[]>;
}

export interface LocationReadPort {
  findWarehouseId(organizationId: string, locationId: string): Promise<string | null>;
  getWarehouseLabel(organizationId: string, warehouseId: string): Promise<string | null>;
}

// ─── DI tokens (framework-agnostic symbols; wired in reports.module.ts) ───────────
export const REPORTS_INVENTORY = Symbol('ReportsInventoryReadPort');
export const REPORTS_CATALOG = Symbol('ReportsCatalogReadPort');
export const REPORTS_LOCATION = Symbol('ReportsLocationReadPort');
