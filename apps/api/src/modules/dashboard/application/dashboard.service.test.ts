import { describe, it, expect } from 'vitest';
import type { InventoryValuationResponse, LowStockRow, StatusCount } from '@stockflow/types';
import type { ActorContext } from '../../../common/auth/actor-context';
import type { ListResult } from '../../../common/resource';
import type {
  CatalogLookupPort,
  InventoryFeedPort,
  LocationLookupPort,
  OrderCountPort,
  RecentMovementRow,
  ReportsReadPort,
} from './ports';
import { DashboardService } from './dashboard.service';

const ctx: ActorContext = { organizationId: 'org-1', actorId: 'user-1' };
const otherTenant: ActorContext = { organizationId: 'org-2', actorId: 'user-2' };

const VARIANT = 'v'.repeat(24);
const LOCATION = 'l'.repeat(24);
const AT = new Date('2026-06-27T10:00:00.000Z');

const VALUATION: InventoryValuationResponse = {
  totals: { totalUnits: 64, totalValueMinor: 13400, variantCount: 3, cellCount: 3 },
  byWarehouse: [{ warehouseId: 'wh-main', warehouseName: 'Main', units: 54, valueMinor: 10400 }],
  currency: 'USD',
};
const LOW_STOCK_ROWS: LowStockRow[] = [
  { variantId: VARIANT, sku: 'A1', productName: 'Widget', onHand: 0, reorderPoint: 8, reorderQty: 8, suggestedQty: 8 },
];

class FakeReports implements ReportsReadPort {
  inventoryValuation(c: ActorContext): Promise<InventoryValuationResponse> {
    if (c.organizationId !== 'org-1') {
      return Promise.resolve({ totals: { totalUnits: 0, totalValueMinor: 0, variantCount: 0, cellCount: 0 }, byWarehouse: [], currency: null });
    }
    return Promise.resolve(VALUATION);
  }
  lowStock(c: ActorContext, q: { page: number; limit: number }): Promise<ListResult<LowStockRow>> {
    const items = c.organizationId === 'org-1' ? LOW_STOCK_ROWS : [];
    const total = c.organizationId === 'org-1' ? 7 : 0; // total intentionally > items.length
    return Promise.resolve({ items, total, page: q.page, limit: q.limit });
  }
}

class FakeOrders implements OrderCountPort {
  constructor(private readonly counts: StatusCount[]) {}
  countByStatus(org: string): Promise<StatusCount[]> {
    return Promise.resolve(org === 'org-1' ? this.counts.map((c) => ({ ...c })) : this.counts.map((c) => ({ ...c, count: 0 })));
  }
}

class FakeInventoryFeed implements InventoryFeedPort {
  constructor(private readonly rows: RecentMovementRow[]) {}
  listRecentMovements(org: string): Promise<RecentMovementRow[]> {
    return Promise.resolve(org === 'org-1' ? this.rows.map((r) => ({ ...r })) : []);
  }
}

class FakeCatalog implements CatalogLookupPort {
  getVariantSnapshot(_org: string, variantId: string): Promise<{ sku: string; productName: string } | null> {
    return Promise.resolve(variantId === VARIANT ? { sku: 'A1', productName: 'Widget' } : null);
  }
}

class FakeLocations implements LocationLookupPort {
  getLocationLabel(_org: string, locationId: string): Promise<string | null> {
    return Promise.resolve(locationId === LOCATION ? 'Aisle 1' : null);
  }
}

const PO_COUNTS: StatusCount[] = [
  { status: 'draft', count: 2 },
  { status: 'submitted', count: 1 },
  { status: 'partially_received', count: 1 },
  { status: 'received', count: 3 },
  { status: 'cancelled', count: 1 },
]; // open = 2 + 1 + 1 = 4
const SO_COUNTS: StatusCount[] = [
  { status: 'draft', count: 1 },
  { status: 'confirmed', count: 2 },
  { status: 'partially_fulfilled', count: 1 },
  { status: 'fulfilled', count: 5 },
  { status: 'cancelled', count: 2 },
]; // open = 1 + 2 + 1 = 4
const TR_COUNTS: StatusCount[] = [
  { status: 'draft', count: 1 },
  { status: 'in_transit', count: 2 },
  { status: 'partially_received', count: 1 },
  { status: 'completed', count: 3 },
  { status: 'cancelled', count: 1 },
]; // in transit = 2 + 1 = 3

const RECENT: RecentMovementRow[] = [
  { id: 'm1', type: 'receipt', reasonKind: 'purchase_order', delta: 10, variantId: VARIANT, locationId: LOCATION, createdAt: AT },
  { id: 'm2', type: 'shipment', reasonKind: 'sales_order', delta: -3, variantId: 'z'.repeat(24), locationId: 'q'.repeat(24), createdAt: AT },
];

function make(): DashboardService {
  return new DashboardService(
    new FakeReports(),
    new FakeOrders(PO_COUNTS),
    new FakeOrders(SO_COUNTS),
    new FakeOrders(TR_COUNTS),
    new FakeInventoryFeed(RECENT),
    new FakeCatalog(),
    new FakeLocations(),
  );
}

describe('DashboardService.getSummary', () => {
  it('assembles the inventory headline from the valuation read-model', async () => {
    const summary = await make().getSummary(ctx);
    expect(summary.inventory).toEqual({ totalValueMinor: 13400, totalUnits: 64, variantCount: 3, currency: 'USD' });
    expect(summary.valuationByWarehouse).toEqual(VALUATION.byWarehouse);
  });

  it('derives open/in-transit counts from the status breakdowns (terminal statuses excluded)', async () => {
    const { counts } = await make().getSummary(ctx);
    expect(counts).toEqual({ lowStock: 7, openPurchaseOrders: 4, openSalesOrders: 4, inTransitTransfers: 3 });
  });

  it('passes the full status breakdowns and top low-stock through', async () => {
    const summary = await make().getSummary(ctx);
    expect(summary.ordersByStatus.purchaseOrders).toEqual(PO_COUNTS);
    expect(summary.ordersByStatus.salesOrders).toEqual(SO_COUNTS);
    expect(summary.ordersByStatus.transfers).toEqual(TR_COUNTS);
    expect(summary.topLowStock).toEqual(LOW_STOCK_ROWS);
  });

  it('enriches the recent-activity feed with sku/name + location label and an ISO timestamp', async () => {
    const { recentMovements } = await make().getSummary(ctx);
    expect(recentMovements).toHaveLength(2);
    expect(recentMovements[0]).toEqual({
      id: 'm1', type: 'receipt', reasonKind: 'purchase_order', delta: 10,
      variantId: VARIANT, sku: 'A1', productName: 'Widget',
      locationId: LOCATION, locationName: 'Aisle 1', createdAt: AT.toISOString(),
    });
    // Unknown variant → empty sku/name; unknown location → null label (never throws).
    expect(recentMovements[1]).toMatchObject({ id: 'm2', sku: '', productName: '', locationName: null });
  });

  it('is empty/zeroed for another tenant', async () => {
    const summary = await make().getSummary(otherTenant);
    expect(summary.inventory).toEqual({ totalValueMinor: 0, totalUnits: 0, variantCount: 0, currency: null });
    expect(summary.counts).toEqual({ lowStock: 0, openPurchaseOrders: 0, openSalesOrders: 0, inTransitTransfers: 0 });
    expect(summary.topLowStock).toEqual([]);
    expect(summary.recentMovements).toEqual([]);
  });
});
