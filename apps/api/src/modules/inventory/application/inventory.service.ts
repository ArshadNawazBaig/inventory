import type {
  CreateAdjustmentRequest,
  StockLevelListQuery,
  StockMovementListQuery,
} from '@stockflow/types';
import type { ActorContext } from '../../../common/auth/actor-context';
import type { ListResult } from '../../../common/resource';
import type { StockLevelEntity, StockMovementEntity } from '../domain/entities';
import {
  InsufficientStockError,
  InvalidStockLocationError,
  InvalidVariantError,
  ZeroDeltaError,
} from '../domain/inventory.errors';
import type {
  InventoryClock,
  InventoryEventPublisher,
  InventoryIdGenerator,
  InventoryPolicyPort,
  InventoryReferencePort,
  StockLevelRepository,
  StockMovementRepository,
} from './ports';

export interface AdjustmentResult {
  movement: StockMovementEntity;
  level: StockLevelEntity;
}

/**
 * The inventory write + read use cases. **Only this module writes the ledger.** A manual adjustment appends
 * one immutable `stock_movements` entry and recomputes the `stock_levels` projection in a single unit of
 * work (the transaction boundary the Mongoose adapter will wrap in a session — DATABASE §11). It enforces
 * the negative-stock policy, idempotency via `opKey`, and weighted-average valuation on costed receipts.
 */
export class InventoryService {
  constructor(
    private readonly movements: StockMovementRepository,
    private readonly levels: StockLevelRepository,
    private readonly references: InventoryReferencePort,
    private readonly policy: InventoryPolicyPort,
    private readonly ids: InventoryIdGenerator,
    private readonly clock: InventoryClock,
    private readonly events: InventoryEventPublisher,
  ) {}

  async adjust(ctx: ActorContext, input: CreateAdjustmentRequest): Promise<AdjustmentResult> {
    const org = ctx.organizationId;
    if (input.delta === 0) throw new ZeroDeltaError();
    if (!(await this.references.variantExists(org, input.variantId))) {
      throw new InvalidVariantError(input.variantId);
    }
    if (!(await this.references.locationExists(org, input.locationId))) {
      throw new InvalidStockLocationError(input.locationId);
    }

    // Idempotency: re-posting the same key returns the original movement (no double-post).
    if (input.opKey) {
      const existing = await this.movements.findByOpKey(org, input.opKey);
      if (existing) {
        const level = await this.requireLevel(org, existing.variantId, existing.locationId);
        return { movement: existing, level };
      }
    }

    const current = await this.levels.findByCell(org, input.variantId, input.locationId);
    const prevOnHand = current?.onHand ?? 0;
    const reserved = current?.reserved ?? 0;
    const newOnHand = prevOnHand + input.delta;

    if (newOnHand < 0 && !(await this.policy.allowNegativeStock(org))) {
      throw new InsufficientStockError(prevOnHand, input.delta);
    }

    // ── Transaction boundary (Mongoose session, later): ledger append + projection upsert are atomic. ──
    const now = this.clock.now();
    const costed = input.unitCostMinor != null && input.delta > 0;
    const movementCurrency = costed ? (input.currency ?? current?.currency ?? null) : null;

    const movement = await this.movements.insert({
      id: this.ids.generate(),
      organizationId: org,
      variantId: input.variantId,
      locationId: input.locationId,
      delta: input.delta,
      type: 'adjustment',
      reason: { kind: 'manual', refId: null, lineId: null },
      unitCostMinor: costed ? input.unitCostMinor! : null,
      currency: movementCurrency,
      note: input.note ?? null,
      opKey: input.opKey ?? this.ids.generate(),
      createdAt: now,
      createdBy: ctx.actorId,
    });

    const avgCostMinor = costed
      ? this.weightedAverage(prevOnHand, current?.avgCostMinor ?? 0, input.delta, input.unitCostMinor!)
      : (current?.avgCostMinor ?? null);

    const level = await this.levels.upsert({
      organizationId: org,
      variantId: input.variantId,
      locationId: input.locationId,
      onHand: newOnHand,
      reserved,
      available: newOnHand - reserved,
      inTransit: current?.inTransit ?? 0,
      avgCostMinor,
      currency: costed ? movementCurrency : (current?.currency ?? null),
      lastMovementAt: now,
      createdAt: current?.createdAt ?? now,
      updatedAt: now,
    });

    this.events.publish({
      action: 'movement.posted',
      organizationId: org,
      variantId: movement.variantId,
      locationId: movement.locationId,
      movementId: movement.id,
      type: movement.type,
      delta: movement.delta,
    });

    return { movement, level };
  }

  async listLevels(ctx: ActorContext, query: StockLevelListQuery): Promise<ListResult<StockLevelEntity>> {
    const { items, total } = await this.levels.list(ctx.organizationId, query);
    return { items, total, page: query.page, limit: query.limit };
  }

  async listMovements(
    ctx: ActorContext,
    query: StockMovementListQuery,
  ): Promise<ListResult<StockMovementEntity>> {
    const { items, total } = await this.movements.list(ctx.organizationId, query);
    return { items, total, page: query.page, limit: query.limit };
  }

  private async requireLevel(
    org: string,
    variantId: string,
    locationId: string,
  ): Promise<StockLevelEntity> {
    const level = await this.levels.findByCell(org, variantId, locationId);
    if (level) return level;
    // A movement exists without a projection only if the projection was never built — treat as zero.
    const now = this.clock.now();
    return {
      organizationId: org,
      variantId,
      locationId,
      onHand: 0,
      reserved: 0,
      available: 0,
      inTransit: 0,
      avgCostMinor: null,
      currency: null,
      lastMovementAt: null,
      createdAt: now,
      updatedAt: now,
    };
  }

  /** Weighted-average unit cost after an inbound delta (DATABASE §6.2). Integer minor units. */
  private weightedAverage(prevQty: number, prevAvg: number, delta: number, unitCost: number): number {
    const newQty = prevQty + delta;
    if (newQty <= 0) return prevAvg;
    const prevValue = prevQty > 0 ? prevQty * prevAvg : 0;
    return Math.round((prevValue + delta * unitCost) / newQty);
  }
}
