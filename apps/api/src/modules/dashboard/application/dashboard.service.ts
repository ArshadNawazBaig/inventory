import type { DashboardSummaryResponse, RecentMovement, StatusCount } from '@stockflow/types';
import type { ActorContext } from '../../../common/auth/actor-context';
import type {
  CatalogLookupPort,
  InventoryFeedPort,
  LocationLookupPort,
  OrderCountPort,
  RecentMovementRow,
  ReportsReadPort,
} from './ports';

/** How many rows each bounded sub-list carries (the overview is a glance, not a full report). */
const TOP_LOW_STOCK = 5;
const RECENT_MOVEMENTS = 8;

/** Terminal statuses are "closed"; everything else counts as open work needing attention. */
const PO_TERMINAL = new Set(['received', 'cancelled']);
const SO_TERMINAL = new Set(['fulfilled', 'cancelled']);
/** A transfer is "in transit" once dispatched and until fully received. */
const TRANSFER_IN_TRANSIT = new Set(['in_transit', 'partially_received']);

function sumWhere(breakdown: StatusCount[], predicate: (status: string) => boolean): number {
  return breakdown.reduce((total, s) => (predicate(s.status) ? total + s.count : total), 0);
}

/**
 * Dashboard use case — read-only **overview** that composes existing read-models into one payload. It reuses
 * the Reports valuation + low-stock aggregations (no duplication), counts open work per order module, and
 * builds an enriched recent-activity feed from the ledger. Owns no collection; writes nothing.
 */
export class DashboardService {
  constructor(
    private readonly reports: ReportsReadPort,
    private readonly purchasing: OrderCountPort,
    private readonly sales: OrderCountPort,
    private readonly transfers: OrderCountPort,
    private readonly inventory: InventoryFeedPort,
    private readonly catalog: CatalogLookupPort,
    private readonly locations: LocationLookupPort,
  ) {}

  async getSummary(ctx: ActorContext): Promise<DashboardSummaryResponse> {
    const org = ctx.organizationId;
    const [valuation, lowStock, purchaseOrders, salesOrders, transfers, recent] = await Promise.all([
      this.reports.inventoryValuation(ctx, {}),
      this.reports.lowStock(ctx, { page: 1, limit: TOP_LOW_STOCK }),
      this.purchasing.countByStatus(org),
      this.sales.countByStatus(org),
      this.transfers.countByStatus(org),
      this.inventory.listRecentMovements(org, RECENT_MOVEMENTS),
    ]);

    const recentMovements = await this.enrichMovements(org, recent);

    return {
      inventory: {
        totalValueMinor: valuation.totals.totalValueMinor,
        totalUnits: valuation.totals.totalUnits,
        variantCount: valuation.totals.variantCount,
        currency: valuation.currency,
      },
      counts: {
        lowStock: lowStock.total,
        openPurchaseOrders: sumWhere(purchaseOrders, (s) => !PO_TERMINAL.has(s)),
        openSalesOrders: sumWhere(salesOrders, (s) => !SO_TERMINAL.has(s)),
        inTransitTransfers: sumWhere(transfers, (s) => TRANSFER_IN_TRANSIT.has(s)),
      },
      valuationByWarehouse: valuation.byWarehouse,
      ordersByStatus: { purchaseOrders, salesOrders, transfers },
      topLowStock: lowStock.items,
      recentMovements,
    };
  }

  /** Resolve each movement's variant sku/name + location label (cached per id; the feed is small). */
  private async enrichMovements(org: string, movements: RecentMovementRow[]): Promise<RecentMovement[]> {
    const variantCache = new Map<string, { sku: string; productName: string } | null>();
    const locationCache = new Map<string, string | null>();
    const rows: RecentMovement[] = [];
    for (const m of movements) {
      if (!variantCache.has(m.variantId)) {
        variantCache.set(m.variantId, await this.catalog.getVariantSnapshot(org, m.variantId));
      }
      if (!locationCache.has(m.locationId)) {
        locationCache.set(m.locationId, await this.locations.getLocationLabel(org, m.locationId));
      }
      const variant = variantCache.get(m.variantId) ?? null;
      rows.push({
        id: m.id,
        type: m.type,
        reasonKind: m.reasonKind,
        delta: m.delta,
        variantId: m.variantId,
        sku: variant?.sku ?? '',
        productName: variant?.productName ?? '',
        locationId: m.locationId,
        locationName: locationCache.get(m.locationId) ?? null,
        createdAt: m.createdAt.toISOString(),
      });
    }
    return rows;
  }
}
