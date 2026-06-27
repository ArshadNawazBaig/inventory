import { Inject, Injectable } from '@nestjs/common';
import type { MovementReasonKind, StockMovementType } from '@stockflow/types';
import type { VariantStockSummary } from '../domain/entities';
import {
  STOCK_LEVEL_REPOSITORY,
  STOCK_MOVEMENT_REPOSITORY,
  type StockLevelRepository,
  type StockMovementRepository,
} from './ports';

/** A flattened (variant × location) projection row — the stable read shape reports aggregate over. */
export interface StockLevelView {
  variantId: string;
  locationId: string;
  onHand: number;
  avgCostMinor: number | null;
  currency: string | null;
}

/** A recent ledger entry — the raw read shape the Dashboard enriches into an activity feed. */
export interface RecentMovementView {
  id: string;
  type: StockMovementType;
  reasonKind: MovementReasonKind;
  delta: number;
  variantId: string;
  locationId: string;
  createdAt: Date;
}

/**
 * The public, read-only window into inventory other modules consume — the read-model that satisfies the
 * Catalog variant-delete guard's `getVariantStockSummary` shape. Aggregates the (variant × location)
 * projections for a variant. `hasOpenOrders` is wired when Purchasing/Sales land (false for now).
 *
 * Note: this is **not** synchronously wired into the Catalog module — doing so would create a Catalog ↔
 * Inventory module cycle (dependency-rules: no circular deps). The proper integration is event/read-model
 * driven and is a recorded follow-up (ADR-019).
 */
@Injectable()
export class InventoryQuery {
  constructor(
    @Inject(STOCK_LEVEL_REPOSITORY) private readonly levels: StockLevelRepository,
    @Inject(STOCK_MOVEMENT_REPOSITORY) private readonly movements: StockMovementRepository,
  ) {}

  async getVariantStockSummary(organizationId: string, variantId: string): Promise<VariantStockSummary> {
    const cells = await this.levels.listByVariant(organizationId, variantId);
    return cells.reduce<VariantStockSummary>(
      (summary, cell) => ({
        onHand: summary.onHand + cell.onHand,
        reserved: summary.reserved + cell.reserved,
        inTransit: summary.inTransit + cell.inTransit,
        hasOpenOrders: summary.hasOpenOrders,
      }),
      { onHand: 0, reserved: 0, inTransit: 0, hasOpenOrders: false },
    );
  }

  /** Every (variant × location) projection row for the tenant — consumed by the Reports module. */
  async listAllLevels(organizationId: string): Promise<StockLevelView[]> {
    const cells = await this.levels.listAll(organizationId);
    return cells.map((cell) => ({
      variantId: cell.variantId,
      locationId: cell.locationId,
      onHand: cell.onHand,
      avgCostMinor: cell.avgCostMinor,
      currency: cell.currency,
    }));
  }

  /** The most recent ledger entries for the tenant (newest first) — consumed by the Dashboard feed. */
  async listRecentMovements(organizationId: string, limit: number): Promise<RecentMovementView[]> {
    const { items } = await this.movements.list(organizationId, { page: 1, limit, sort: '-createdAt' });
    return items.map((m) => ({
      id: m.id,
      type: m.type,
      reasonKind: m.reason.kind,
      delta: m.delta,
      variantId: m.variantId,
      locationId: m.locationId,
      createdAt: m.createdAt,
    }));
  }
}
