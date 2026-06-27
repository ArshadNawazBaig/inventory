import type {
  InventoryValuationResponse,
  LowStockRow,
  MovementReasonKind,
  StatusCount,
  StockMovementType,
} from '@stockflow/types';
import type { ActorContext } from '../../../common/auth/actor-context';
import type { ListResult } from '../../../common/resource';

/**
 * Read-only ports the Dashboard composes over. Each structurally matches a service it binds to by identity
 * (ReportsService / PurchasingQuery / SalesQuery / TransfersQuery / InventoryQuery / CatalogQuery /
 * LocationQuery) — the Dashboard depends one-way on those modules; it owns no collection and writes nothing.
 */

/** Window into Reports — the already-aggregated valuation + low-stock read-models (DRY, not re-derived). */
export interface ReportsReadPort {
  inventoryValuation(
    ctx: ActorContext,
    query: { warehouseId?: string },
  ): Promise<InventoryValuationResponse>;
  lowStock(ctx: ActorContext, query: { page: number; limit: number }): Promise<ListResult<LowStockRow>>;
}

/** Window into an order module — the per-status tally (complete set; count 0 for absent statuses). */
export interface OrderCountPort {
  countByStatus(organizationId: string): Promise<StatusCount[]>;
}

/** The raw recent-ledger shape Inventory exposes; the Dashboard enriches it with sku/name + location label. */
export interface RecentMovementRow {
  id: string;
  type: StockMovementType;
  reasonKind: MovementReasonKind;
  delta: number;
  variantId: string;
  locationId: string;
  createdAt: Date;
}

/** Window into Inventory — the newest ledger entries for the activity feed. */
export interface InventoryFeedPort {
  listRecentMovements(organizationId: string, limit: number): Promise<RecentMovementRow[]>;
}

/** Window into Catalog — resolve a variant's sku + product name for the feed (null when not live). */
export interface CatalogLookupPort {
  getVariantSnapshot(
    organizationId: string,
    variantId: string,
  ): Promise<{ sku: string; productName: string } | null>;
}

/** Window into Locations — resolve a location's display label for the feed. */
export interface LocationLookupPort {
  getLocationLabel(organizationId: string, locationId: string): Promise<string | null>;
}

// ─── DI tokens (framework-agnostic symbols; wired in dashboard.module.ts) ─────────
export const DASHBOARD_REPORTS = Symbol('DashboardReportsReadPort');
export const DASHBOARD_PURCHASING = Symbol('DashboardPurchasingCountPort');
export const DASHBOARD_SALES = Symbol('DashboardSalesCountPort');
export const DASHBOARD_TRANSFERS = Symbol('DashboardTransfersCountPort');
export const DASHBOARD_INVENTORY = Symbol('DashboardInventoryFeedPort');
export const DASHBOARD_CATALOG = Symbol('DashboardCatalogLookupPort');
export const DASHBOARD_LOCATION = Symbol('DashboardLocationLookupPort');
