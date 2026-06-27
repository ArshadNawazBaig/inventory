import { describe, it, expect } from 'vitest';
import type { ActorContext } from '../../../common/auth/actor-context';
import type {
  CatalogReadPort,
  InventoryReadPort,
  LocationReadPort,
  ReorderVariant,
  StockLevelRow,
} from './ports';
import { ReportsService } from './reports.service';

const ctx: ActorContext = { organizationId: 'org-1', actorId: 'user-1' };
const otherTenant: ActorContext = { organizationId: 'org-2', actorId: 'user-2' };

const WH_X = 'x'.repeat(24);
const WH_Y = 'y'.repeat(24);
const LOC_A = 'a'.repeat(24);
const LOC_B = 'b'.repeat(24);
const LOC_C = 'c'.repeat(24);

class FakeInventory implements InventoryReadPort {
  constructor(private readonly rows: StockLevelRow[]) {}
  listAllLevels(org: string): Promise<StockLevelRow[]> {
    return Promise.resolve(org === 'org-1' ? this.rows.map((r) => ({ ...r })) : []);
  }
}
class FakeCatalog implements CatalogReadPort {
  constructor(private readonly variants: ReorderVariant[]) {}
  listReorderVariants(org: string): Promise<ReorderVariant[]> {
    return Promise.resolve(org === 'org-1' ? this.variants.map((v) => ({ ...v })) : []);
  }
}
class FakeLocations implements LocationReadPort {
  private readonly warehouseOf: Record<string, string> = { [LOC_A]: WH_X, [LOC_B]: WH_Y, [LOC_C]: WH_X };
  private readonly names: Record<string, string> = { [WH_X]: 'Main', [WH_Y]: 'East' };
  findWarehouseId(_org: string, locationId: string): Promise<string | null> {
    return Promise.resolve(this.warehouseOf[locationId] ?? null);
  }
  getWarehouseLabel(_org: string, warehouseId: string): Promise<string | null> {
    return Promise.resolve(this.names[warehouseId] ?? null);
  }
}

describe('ReportsService.inventoryValuation', () => {
  function make() {
    const inventory = new FakeInventory([
      { variantId: 'v1', locationId: LOC_A, onHand: 10, avgCostMinor: 100, currency: 'USD' }, // 1000
      { variantId: 'v1', locationId: LOC_B, onHand: 5, avgCostMinor: 200, currency: 'USD' }, // 1000
      { variantId: 'v2', locationId: LOC_A, onHand: 0, avgCostMinor: 50, currency: 'USD' }, // empty → skipped
      { variantId: 'v3', locationId: LOC_C, onHand: 3, avgCostMinor: null, currency: null }, // uncosted → 0
    ]);
    return new ReportsService(inventory, new FakeCatalog([]), new FakeLocations());
  }

  it('values stock at weighted-average cost and rolls up totals', async () => {
    const report = await make().inventoryValuation(ctx, {});
    expect(report.totals).toEqual({ totalUnits: 18, totalValueMinor: 2000, variantCount: 2, cellCount: 3 });
    expect(report.currency).toBe('USD');
  });

  it('breaks value down by warehouse (empty cells excluded)', async () => {
    const report = await make().inventoryValuation(ctx, {});
    const byId = Object.fromEntries(report.byWarehouse.map((w) => [w.warehouseId, w]));
    expect(byId[WH_X]).toMatchObject({ warehouseName: 'Main', units: 13, valueMinor: 1000 }); // LOC_A v1 + LOC_C v3
    expect(byId[WH_Y]).toMatchObject({ warehouseName: 'East', units: 5, valueMinor: 1000 });
  });

  it('scopes to a single warehouse when filtered', async () => {
    const report = await make().inventoryValuation(ctx, { warehouseId: WH_Y });
    expect(report.totals).toEqual({ totalUnits: 5, totalValueMinor: 1000, variantCount: 1, cellCount: 1 });
    expect(report.byWarehouse).toHaveLength(1);
    expect(report.byWarehouse[0]?.warehouseId).toBe(WH_Y);
  });

  it('is empty for another tenant', async () => {
    const report = await make().inventoryValuation(otherTenant, {});
    expect(report.totals).toEqual({ totalUnits: 0, totalValueMinor: 0, variantCount: 0, cellCount: 0 });
    expect(report.byWarehouse).toEqual([]);
  });
});

describe('ReportsService.lowStock', () => {
  function make() {
    const inventory = new FakeInventory([
      { variantId: 'v1', locationId: LOC_A, onHand: 10, avgCostMinor: 100, currency: 'USD' },
      { variantId: 'v1', locationId: LOC_B, onHand: 5, avgCostMinor: 100, currency: 'USD' }, // v1 total 15 (healthy)
      { variantId: 'v2', locationId: LOC_A, onHand: 0, avgCostMinor: null, currency: null }, // v2 total 0 (low)
    ]);
    const catalog = new FakeCatalog([
      { variantId: 'v1', sku: 'SKU-1', productName: 'Widget', reorderPoint: 10, reorderQty: 20 }, // healthy (15 > 10)
      { variantId: 'v2', sku: 'SKU-2', productName: 'Gadget', reorderPoint: 5, reorderQty: 0 }, // low, no level value
      { variantId: 'v3', sku: 'SKU-3', productName: 'Gizmo', reorderPoint: 8, reorderQty: 4 }, // out of stock (no levels)
      { variantId: 'v5', sku: 'SKU-5', productName: 'Sprocket', reorderPoint: 100, reorderQty: 50 }, // out of stock
    ]);
    return new ReportsService(inventory, catalog, new FakeLocations());
  }
  const LIST = { page: 1, limit: 20 };

  it('lists variants at/below reorder point including out-of-stock, most urgent first', async () => {
    const result = await make().lowStock(ctx, LIST);
    expect(result.total).toBe(3); // v1 healthy is excluded
    expect(result.items.map((r) => r.sku)).toEqual(['SKU-5', 'SKU-3', 'SKU-2']); // shortfall 100, 8, 5
  });

  it('computes onHand (0 for items with no stock rows) and a suggested order qty', async () => {
    const rows = (await make().lowStock(ctx, LIST)).items;
    const byId = Object.fromEntries(rows.map((r) => [r.sku, r]));
    expect(byId['SKU-2']).toMatchObject({ onHand: 0, reorderPoint: 5, reorderQty: 0, suggestedQty: 5 });
    expect(byId['SKU-3']).toMatchObject({ onHand: 0, suggestedQty: 8 }); // max(reorderQty 4, shortfall 8)
    expect(byId['SKU-5']).toMatchObject({ onHand: 0, suggestedQty: 100 }); // max(50, 100)
  });

  it('paginates', async () => {
    const page1 = await make().lowStock(ctx, { page: 1, limit: 2 });
    expect(page1.items.map((r) => r.sku)).toEqual(['SKU-5', 'SKU-3']);
    expect(page1.total).toBe(3);
    const page2 = await make().lowStock(ctx, { page: 2, limit: 2 });
    expect(page2.items.map((r) => r.sku)).toEqual(['SKU-2']);
  });

  it('is empty for another tenant', async () => {
    expect((await make().lowStock(otherTenant, LIST)).total).toBe(0);
  });
});
