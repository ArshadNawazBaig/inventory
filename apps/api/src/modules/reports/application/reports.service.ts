import type {
  InventoryValuationQuery,
  InventoryValuationResponse,
  LowStockListQuery,
  LowStockRow,
} from '@stockflow/types';
import type { ActorContext } from '../../../common/auth/actor-context';
import type { ListResult } from '../../../common/resource';
import type { CatalogReadPort, InventoryReadPort, LocationReadPort } from './ports';

const UNASSIGNED = '__unassigned__';

/**
 * Reports use cases — read-only, cross-module aggregations. **Inventory valuation** values each (variant ×
 * location) cell at its weighted-average cost and rolls up totals + a by-warehouse breakdown. **Low stock**
 * lists reorder-eligible variants whose on-hand (summed across locations) is at/below the reorder point —
 * including out-of-stock items (most urgent first). Computed synchronously; async + export is a follow-up.
 */
export class ReportsService {
  constructor(
    private readonly inventory: InventoryReadPort,
    private readonly catalog: CatalogReadPort,
    private readonly locations: LocationReadPort,
  ) {}

  async inventoryValuation(
    ctx: ActorContext,
    query: InventoryValuationQuery,
  ): Promise<InventoryValuationResponse> {
    const org = ctx.organizationId;
    const levels = await this.inventory.listAllLevels(org);

    const warehouseOf = new Map<string, string | null>();
    const resolveWarehouse = async (locationId: string): Promise<string | null> => {
      if (!warehouseOf.has(locationId)) {
        warehouseOf.set(locationId, await this.locations.findWarehouseId(org, locationId));
      }
      return warehouseOf.get(locationId) ?? null;
    };

    let totalUnits = 0;
    let totalValueMinor = 0;
    let cellCount = 0;
    let currency: string | null = null;
    const variants = new Set<string>();
    const byWarehouse = new Map<string, { units: number; valueMinor: number }>();

    for (const level of levels) {
      if (level.onHand === 0) continue; // empty cells don't contribute value
      const warehouseId = await resolveWarehouse(level.locationId);
      if (query.warehouseId && warehouseId !== query.warehouseId) continue;

      const value = level.onHand * (level.avgCostMinor ?? 0);
      totalUnits += level.onHand;
      totalValueMinor += value;
      cellCount += 1;
      variants.add(level.variantId);
      if (currency === null && level.currency) currency = level.currency;

      const key = warehouseId ?? UNASSIGNED;
      const agg = byWarehouse.get(key) ?? { units: 0, valueMinor: 0 };
      agg.units += level.onHand;
      agg.valueMinor += value;
      byWarehouse.set(key, agg);
    }

    const breakdown = [];
    for (const [warehouseId, agg] of byWarehouse) {
      breakdown.push({
        warehouseId,
        warehouseName: warehouseId === UNASSIGNED ? null : await this.locations.getWarehouseLabel(org, warehouseId),
        units: agg.units,
        valueMinor: agg.valueMinor,
      });
    }
    breakdown.sort((a, b) => b.valueMinor - a.valueMinor);

    return {
      totals: { totalUnits, totalValueMinor, variantCount: variants.size, cellCount },
      byWarehouse: breakdown,
      currency,
    };
  }

  async lowStock(ctx: ActorContext, query: LowStockListQuery): Promise<ListResult<LowStockRow>> {
    const org = ctx.organizationId;
    const [reorderVariants, levels] = await Promise.all([
      this.catalog.listReorderVariants(org),
      this.inventory.listAllLevels(org),
    ]);

    const onHandOf = new Map<string, number>();
    for (const level of levels) {
      onHandOf.set(level.variantId, (onHandOf.get(level.variantId) ?? 0) + level.onHand);
    }

    const rows: LowStockRow[] = [];
    for (const variant of reorderVariants) {
      const onHand = onHandOf.get(variant.variantId) ?? 0;
      if (onHand > variant.reorderPoint) continue; // healthy
      const shortfall = variant.reorderPoint - onHand;
      rows.push({
        variantId: variant.variantId,
        sku: variant.sku,
        productName: variant.productName,
        onHand,
        reorderPoint: variant.reorderPoint,
        reorderQty: variant.reorderQty,
        suggestedQty: Math.max(variant.reorderQty, shortfall),
      });
    }

    // Most urgent first (largest shortfall), then SKU for a stable order.
    rows.sort(
      (a, b) => b.reorderPoint - b.onHand - (a.reorderPoint - a.onHand) || (a.sku < b.sku ? -1 : 1),
    );

    const total = rows.length;
    const start = (query.page - 1) * query.limit;
    return { items: rows.slice(start, start + query.limit), total, page: query.page, limit: query.limit };
  }
}
