import type {
  CreatePurchaseOrderRequest,
  OrderTotals,
  PurchaseOrderListQuery,
  PurchaseOrderLineInput,
  ReceivePurchaseOrderRequest,
  UpdatePurchaseOrderRequest,
} from '@stockflow/types';
import type { ActorContext } from '../../../common/auth/actor-context';
import { computeOrderTotals } from '../../../common/orders';
import {
  ResourceNotFoundError,
  type ListResult,
  type ResourceClock,
  type ResourceIdGenerator,
} from '../../../common/resource';
import type { PurchaseOrderEntity, PurchaseOrderLine } from '../domain/entities';
import {
  InvalidPurchaseLineError,
  InvalidPurchaseWarehouseError,
  InvalidReceiveLocationError,
  InvalidSupplierError,
  OverReceiveError,
  PurchaseOrderStateError,
  UnknownPurchaseLineError,
} from '../domain/purchasing.errors';
import type {
  CatalogRef,
  PurchaseOrderRepository,
  ReceiptPoster,
  SupplierRef,
  WarehouseLocationRef,
} from './ports';

/**
 * Purchase Order use cases. Drafts are freely editable; submitting locks the order; **receiving posts
 * `receipt` movements into Inventory** (the only way stock enters from a PO) and advances line/PO status.
 * Lines snapshot the variant's sku/name at order time. Movements are idempotent on a deterministic `opKey`.
 */
export class PurchasingService {
  constructor(
    private readonly repo: PurchaseOrderRepository,
    private readonly catalog: CatalogRef,
    private readonly suppliers: SupplierRef,
    private readonly locations: WarehouseLocationRef,
    private readonly receipts: ReceiptPoster,
    private readonly ids: ResourceIdGenerator,
    private readonly clock: ResourceClock,
  ) {}

  async get(ctx: ActorContext, id: string): Promise<PurchaseOrderEntity> {
    return this.requireOrder(ctx.organizationId, id);
  }

  async list(ctx: ActorContext, query: PurchaseOrderListQuery): Promise<ListResult<PurchaseOrderEntity>> {
    const { items, total } = await this.repo.list(ctx.organizationId, query);
    return { items, total, page: query.page, limit: query.limit };
  }

  async create(ctx: ActorContext, input: CreatePurchaseOrderRequest): Promise<PurchaseOrderEntity> {
    const org = ctx.organizationId;
    if (!(await this.suppliers.supplierExists(org, input.supplierId))) {
      throw new InvalidSupplierError(input.supplierId);
    }
    if (!(await this.locations.warehouseExists(org, input.warehouseId))) {
      throw new InvalidPurchaseWarehouseError(input.warehouseId);
    }
    const lines = await this.buildLines(org, input.lines);
    const now = this.clock.now();
    const order: PurchaseOrderEntity = {
      id: this.ids.generate(),
      organizationId: org,
      poNumber: await this.repo.nextNumber(org),
      supplierId: input.supplierId,
      supplierName: await this.suppliers.getSupplierName(org, input.supplierId),
      warehouseId: input.warehouseId,
      currency: input.currency,
      status: 'draft',
      expectedAt: input.expectedAt ?? null,
      note: input.note ?? null,
      lines,
      totals: this.totals(lines),
      createdAt: now,
      updatedAt: now,
      createdBy: ctx.actorId,
      updatedBy: ctx.actorId,
    };
    return this.repo.insert(order);
  }

  async update(ctx: ActorContext, id: string, input: UpdatePurchaseOrderRequest): Promise<PurchaseOrderEntity> {
    const org = ctx.organizationId;
    const existing = await this.requireOrder(org, id);
    if (existing.status !== 'draft') {
      throw new PurchaseOrderStateError('Only draft purchase orders can be edited.');
    }
    const patch: Partial<PurchaseOrderEntity> = {};
    if (input.warehouseId !== undefined) {
      if (!(await this.locations.warehouseExists(org, input.warehouseId))) {
        throw new InvalidPurchaseWarehouseError(input.warehouseId);
      }
      patch.warehouseId = input.warehouseId;
    }
    if (input.currency !== undefined) patch.currency = input.currency;
    if (input.expectedAt !== undefined) patch.expectedAt = input.expectedAt;
    if (input.note !== undefined) patch.note = input.note;
    if (input.lines !== undefined) {
      const lines = await this.buildLines(org, input.lines);
      patch.lines = lines;
      patch.totals = this.totals(lines);
    }
    return this.save(ctx, id, patch);
  }

  async submit(ctx: ActorContext, id: string): Promise<PurchaseOrderEntity> {
    const existing = await this.requireOrder(ctx.organizationId, id);
    if (existing.status !== 'draft') {
      throw new PurchaseOrderStateError('Only draft purchase orders can be submitted.');
    }
    return this.save(ctx, id, { status: 'submitted' });
  }

  async cancel(ctx: ActorContext, id: string): Promise<PurchaseOrderEntity> {
    const existing = await this.requireOrder(ctx.organizationId, id);
    if (existing.status !== 'draft' && existing.status !== 'submitted') {
      throw new PurchaseOrderStateError('Only draft or submitted purchase orders can be cancelled.');
    }
    return this.save(ctx, id, { status: 'cancelled' });
  }

  /**
   * Receive stock against a submitted PO: validate the location is in the receiving warehouse, post a
   * `receipt` movement per line (costed → weighted-average), advance `receivedQty`, and recompute status.
   */
  async receive(
    ctx: ActorContext,
    id: string,
    input: ReceivePurchaseOrderRequest,
  ): Promise<PurchaseOrderEntity> {
    const org = ctx.organizationId;
    const existing = await this.requireOrder(org, id);
    if (existing.status !== 'submitted' && existing.status !== 'partially_received') {
      throw new PurchaseOrderStateError('Only submitted purchase orders can be received.');
    }
    if (!(await this.locations.locationExists(org, input.locationId))) {
      throw new InvalidReceiveLocationError(`Location "${input.locationId}" does not exist.`);
    }
    if ((await this.locations.findWarehouseId(org, input.locationId)) !== existing.warehouseId) {
      throw new InvalidReceiveLocationError("Location is not in this order's receiving warehouse.");
    }

    const lines = existing.lines.map((line) => ({ ...line }));
    const byId = new Map(lines.map((line) => [line.id, line]));

    // Validate every requested receipt before posting any movement.
    for (const request of input.lines) {
      const line = byId.get(request.lineId);
      if (!line) throw new UnknownPurchaseLineError(request.lineId);
      const outstanding = line.orderedQty - line.receivedQty;
      if (request.quantity > outstanding) throw new OverReceiveError(line.id, outstanding);
    }

    // Post the receipts (idempotent on opKey) and advance the lines.
    for (const request of input.lines) {
      const line = byId.get(request.lineId)!;
      const newReceived = line.receivedQty + request.quantity;
      await this.receipts.receive(ctx, {
        variantId: line.variantId,
        locationId: input.locationId,
        quantity: request.quantity,
        unitCostMinor: line.unitCostMinor,
        currency: existing.currency,
        refId: existing.id,
        lineId: line.id,
        opKey: `po:${existing.id}:${line.id}:${newReceived}`,
      });
      line.receivedQty = newReceived;
    }

    const status = lines.every((line) => line.receivedQty >= line.orderedQty)
      ? 'received'
      : 'partially_received';
    return this.save(ctx, id, { lines, status });
  }

  // ─── helpers ─────────────────────────────────────────────────────────────────
  private async buildLines(
    org: string,
    inputs: PurchaseOrderLineInput[],
  ): Promise<PurchaseOrderLine[]> {
    const lines: PurchaseOrderLine[] = [];
    for (const input of inputs) {
      const snapshot = await this.catalog.getVariantSnapshot(org, input.variantId);
      if (!snapshot) throw new InvalidPurchaseLineError(input.variantId);
      lines.push({
        id: this.ids.generate(),
        variantId: input.variantId,
        skuSnapshot: snapshot.sku,
        nameSnapshot: snapshot.productName,
        orderedQty: input.orderedQty,
        receivedQty: 0,
        unitCostMinor: input.unitCostMinor,
      });
    }
    return lines;
  }

  private totals(lines: PurchaseOrderLine[]): OrderTotals {
    return computeOrderTotals(lines.map((line) => ({ quantity: line.orderedQty, unitMinor: line.unitCostMinor })));
  }

  private async requireOrder(org: string, id: string): Promise<PurchaseOrderEntity> {
    const order = await this.repo.findById(org, id);
    if (!order) throw new ResourceNotFoundError('purchase order', id);
    return order;
  }

  private async save(
    ctx: ActorContext,
    id: string,
    patch: Partial<PurchaseOrderEntity>,
  ): Promise<PurchaseOrderEntity> {
    const updated = await this.repo.update(ctx.organizationId, id, {
      ...patch,
      updatedAt: this.clock.now(),
      updatedBy: ctx.actorId,
    });
    if (!updated) throw new ResourceNotFoundError('purchase order', id);
    return updated;
  }
}
