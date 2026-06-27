import type {
  CreateAdjustmentRequest,
  MovementReason,
  StockLevelListQuery,
  StockMovementListQuery,
  StockMovementType,
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

/** A generalized ledger write — the single primitive every movement (adjust/receipt/shipment/…) flows through. */
export interface PostMovementCommand {
  variantId: string;
  locationId: string;
  delta: number;
  type: StockMovementType;
  reason: MovementReason;
  unitCostMinor?: number | null;
  currency?: string | null;
  note?: string | null;
  opKey?: string | undefined;
}

/** A purchase-order receipt (inbound, costed) posted into a location. */
export interface ReceiveCommand {
  variantId: string;
  locationId: string;
  quantity: number;
  unitCostMinor?: number | null;
  currency?: string | null;
  refId: string;
  lineId: string;
  opKey?: string | undefined;
}

/** A sales-order shipment (outbound) posted out of a location. */
export interface ShipCommand {
  variantId: string;
  locationId: string;
  quantity: number;
  refId: string;
  lineId: string;
  opKey?: string | undefined;
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

  /** Manual adjustment — the operator-facing write (`type=adjustment`, `reason.kind=manual`). */
  async adjust(ctx: ActorContext, input: CreateAdjustmentRequest): Promise<AdjustmentResult> {
    return this.postMovement(ctx, {
      variantId: input.variantId,
      locationId: input.locationId,
      delta: input.delta,
      type: 'adjustment',
      reason: { kind: 'manual', refId: null, lineId: null },
      unitCostMinor: input.unitCostMinor ?? null,
      currency: input.currency ?? null,
      note: input.note ?? null,
      opKey: input.opKey,
    });
  }

  /** Post a purchase-order receipt (inbound, costed) — drives weighted-average valuation. */
  async receive(ctx: ActorContext, cmd: ReceiveCommand): Promise<AdjustmentResult> {
    return this.postMovement(ctx, {
      variantId: cmd.variantId,
      locationId: cmd.locationId,
      delta: cmd.quantity,
      type: 'receipt',
      reason: { kind: 'purchase_order', refId: cmd.refId, lineId: cmd.lineId },
      unitCostMinor: cmd.unitCostMinor ?? null,
      currency: cmd.currency ?? null,
      note: null,
      opKey: cmd.opKey,
    });
  }

  /** Post a sales-order shipment (outbound) — negative-guarded by the tenant policy. */
  async ship(ctx: ActorContext, cmd: ShipCommand): Promise<AdjustmentResult> {
    return this.postMovement(ctx, {
      variantId: cmd.variantId,
      locationId: cmd.locationId,
      delta: -cmd.quantity,
      type: 'shipment',
      reason: { kind: 'sales_order', refId: cmd.refId, lineId: cmd.lineId },
      unitCostMinor: null,
      currency: null,
      note: null,
      opKey: cmd.opKey,
    });
  }

  /**
   * The single ledger-write primitive: every movement (adjust/receipt/shipment/…) flows through here.
   * Appends one immutable entry and recomputes the projection in one unit of work; enforces the negative
   * guard, idempotency on `opKey`, and weighted-average valuation on costed inbound deltas.
   */
  async postMovement(ctx: ActorContext, cmd: PostMovementCommand): Promise<AdjustmentResult> {
    const org = ctx.organizationId;
    if (cmd.delta === 0) throw new ZeroDeltaError();
    if (!(await this.references.variantExists(org, cmd.variantId))) {
      throw new InvalidVariantError(cmd.variantId);
    }
    if (!(await this.references.locationExists(org, cmd.locationId))) {
      throw new InvalidStockLocationError(cmd.locationId);
    }

    // Idempotency: re-posting the same key returns the original movement (no double-post).
    if (cmd.opKey) {
      const existing = await this.movements.findByOpKey(org, cmd.opKey);
      if (existing) {
        const level = await this.requireLevel(org, existing.variantId, existing.locationId);
        return { movement: existing, level };
      }
    }

    const current = await this.levels.findByCell(org, cmd.variantId, cmd.locationId);
    const prevOnHand = current?.onHand ?? 0;
    const reserved = current?.reserved ?? 0;
    const newOnHand = prevOnHand + cmd.delta;

    if (newOnHand < 0 && !(await this.policy.allowNegativeStock(org))) {
      throw new InsufficientStockError(prevOnHand, cmd.delta);
    }

    // ── Transaction boundary (Mongoose session, later): ledger append + projection upsert are atomic. ──
    const now = this.clock.now();
    const costed = cmd.unitCostMinor != null && cmd.delta > 0;
    const movementCurrency = costed ? (cmd.currency ?? current?.currency ?? null) : null;

    const movement = await this.movements.insert({
      id: this.ids.generate(),
      organizationId: org,
      variantId: cmd.variantId,
      locationId: cmd.locationId,
      delta: cmd.delta,
      type: cmd.type,
      reason: cmd.reason,
      unitCostMinor: costed ? cmd.unitCostMinor! : null,
      currency: movementCurrency,
      note: cmd.note ?? null,
      opKey: cmd.opKey ?? this.ids.generate(),
      createdAt: now,
      createdBy: ctx.actorId,
    });

    const avgCostMinor = costed
      ? this.weightedAverage(prevOnHand, current?.avgCostMinor ?? 0, cmd.delta, cmd.unitCostMinor!)
      : (current?.avgCostMinor ?? null);

    const level = await this.levels.upsert({
      organizationId: org,
      variantId: cmd.variantId,
      locationId: cmd.locationId,
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
