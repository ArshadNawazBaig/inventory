import type {
  CreateSalesOrderRequest,
  FulfillSalesOrderRequest,
  OrderTotals,
  SalesOrderLineInput,
  SalesOrderListQuery,
  UpdateSalesOrderRequest,
} from '@stockflow/types';
import type { ActorContext } from '../../../common/auth/actor-context';
import { computeOrderTotals } from '../../../common/orders';
import {
  ResourceNotFoundError,
  type ListResult,
  type ResourceClock,
  type ResourceIdGenerator,
} from '../../../common/resource';
import type { SalesOrderEntity, SalesOrderLine } from '../domain/entities';
import {
  InvalidCustomerError,
  InvalidFulfillLocationError,
  InvalidSalesLineError,
  InvalidSalesWarehouseError,
  OverFulfillError,
  SalesOrderStateError,
  UnknownSalesLineError,
} from '../domain/sales.errors';
import type {
  CatalogRef,
  CustomerRef,
  SalesOrderRepository,
  ShipmentPoster,
  WarehouseLocationRef,
} from './ports';

/**
 * Sales Order use cases. Drafts are freely editable; confirming locks the order; **fulfilling posts
 * `shipment` movements out of Inventory** (the only way stock leaves from an SO, negative-guarded) and
 * advances line/SO status. Lines snapshot the variant's sku/name + price. Movements are idempotent on a
 * deterministic `opKey`. (ATP reservations on confirm are a documented follow-up — see ADR-021.)
 */
export class SalesService {
  constructor(
    private readonly repo: SalesOrderRepository,
    private readonly catalog: CatalogRef,
    private readonly customers: CustomerRef,
    private readonly locations: WarehouseLocationRef,
    private readonly shipments: ShipmentPoster,
    private readonly ids: ResourceIdGenerator,
    private readonly clock: ResourceClock,
  ) {}

  async get(ctx: ActorContext, id: string): Promise<SalesOrderEntity> {
    return this.requireOrder(ctx.organizationId, id);
  }

  async list(ctx: ActorContext, query: SalesOrderListQuery): Promise<ListResult<SalesOrderEntity>> {
    const { items, total } = await this.repo.list(ctx.organizationId, query);
    return { items, total, page: query.page, limit: query.limit };
  }

  async create(ctx: ActorContext, input: CreateSalesOrderRequest): Promise<SalesOrderEntity> {
    const org = ctx.organizationId;
    if (!(await this.customers.customerExists(org, input.customerId))) {
      throw new InvalidCustomerError(input.customerId);
    }
    if (!(await this.locations.warehouseExists(org, input.warehouseId))) {
      throw new InvalidSalesWarehouseError(input.warehouseId);
    }
    const lines = await this.buildLines(org, input.lines);
    const now = this.clock.now();
    const order: SalesOrderEntity = {
      id: this.ids.generate(),
      organizationId: org,
      soNumber: await this.repo.nextNumber(org),
      customerId: input.customerId,
      customerName: await this.customers.getCustomerName(org, input.customerId),
      warehouseId: input.warehouseId,
      currency: input.currency,
      status: 'draft',
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

  async update(ctx: ActorContext, id: string, input: UpdateSalesOrderRequest): Promise<SalesOrderEntity> {
    const org = ctx.organizationId;
    const existing = await this.requireOrder(org, id);
    if (existing.status !== 'draft') {
      throw new SalesOrderStateError('Only draft sales orders can be edited.');
    }
    const patch: Partial<SalesOrderEntity> = {};
    if (input.warehouseId !== undefined) {
      if (!(await this.locations.warehouseExists(org, input.warehouseId))) {
        throw new InvalidSalesWarehouseError(input.warehouseId);
      }
      patch.warehouseId = input.warehouseId;
    }
    if (input.currency !== undefined) patch.currency = input.currency;
    if (input.note !== undefined) patch.note = input.note;
    if (input.lines !== undefined) {
      const lines = await this.buildLines(org, input.lines);
      patch.lines = lines;
      patch.totals = this.totals(lines);
    }
    return this.save(ctx, id, patch);
  }

  async confirm(ctx: ActorContext, id: string): Promise<SalesOrderEntity> {
    const existing = await this.requireOrder(ctx.organizationId, id);
    if (existing.status !== 'draft') {
      throw new SalesOrderStateError('Only draft sales orders can be confirmed.');
    }
    return this.save(ctx, id, { status: 'confirmed' });
  }

  async cancel(ctx: ActorContext, id: string): Promise<SalesOrderEntity> {
    const existing = await this.requireOrder(ctx.organizationId, id);
    if (existing.status !== 'draft' && existing.status !== 'confirmed') {
      throw new SalesOrderStateError('Only draft or confirmed sales orders can be cancelled.');
    }
    return this.save(ctx, id, { status: 'cancelled' });
  }

  /**
   * Fulfil a confirmed SO: validate the location is in the fulfilment warehouse, post a `shipment` movement
   * per line (negative-guarded by Inventory), advance `shippedQty`, and recompute status. Availability is
   * pre-checked across all lines before any movement is posted (best-effort atomicity in-memory).
   */
  async fulfill(
    ctx: ActorContext,
    id: string,
    input: FulfillSalesOrderRequest,
  ): Promise<SalesOrderEntity> {
    const org = ctx.organizationId;
    const existing = await this.requireOrder(org, id);
    if (existing.status !== 'confirmed' && existing.status !== 'partially_fulfilled') {
      throw new SalesOrderStateError('Only confirmed sales orders can be fulfilled.');
    }
    if (!(await this.locations.locationExists(org, input.locationId))) {
      throw new InvalidFulfillLocationError(`Location "${input.locationId}" does not exist.`);
    }
    if ((await this.locations.findWarehouseId(org, input.locationId)) !== existing.warehouseId) {
      throw new InvalidFulfillLocationError("Location is not in this order's fulfilment warehouse.");
    }

    const lines = existing.lines.map((line) => ({ ...line }));
    const byId = new Map(lines.map((line) => [line.id, line]));

    // Validate every requested shipment before posting any movement.
    for (const request of input.lines) {
      const line = byId.get(request.lineId);
      if (!line) throw new UnknownSalesLineError(request.lineId);
      const outstanding = line.orderedQty - line.shippedQty;
      if (request.quantity > outstanding) throw new OverFulfillError(line.id, outstanding);
    }

    // Post the shipments (idempotent on opKey; negative-guarded) and advance the lines.
    for (const request of input.lines) {
      const line = byId.get(request.lineId)!;
      const newShipped = line.shippedQty + request.quantity;
      await this.shipments.ship(ctx, {
        variantId: line.variantId,
        locationId: input.locationId,
        quantity: request.quantity,
        refId: existing.id,
        lineId: line.id,
        opKey: `so:${existing.id}:${line.id}:${newShipped}`,
      });
      line.shippedQty = newShipped;
    }

    const status = lines.every((line) => line.shippedQty >= line.orderedQty)
      ? 'fulfilled'
      : 'partially_fulfilled';
    return this.save(ctx, id, { lines, status });
  }

  // ─── helpers ─────────────────────────────────────────────────────────────────
  private async buildLines(org: string, inputs: SalesOrderLineInput[]): Promise<SalesOrderLine[]> {
    const lines: SalesOrderLine[] = [];
    for (const input of inputs) {
      const snapshot = await this.catalog.getVariantSnapshot(org, input.variantId);
      if (!snapshot) throw new InvalidSalesLineError(input.variantId);
      lines.push({
        id: this.ids.generate(),
        variantId: input.variantId,
        skuSnapshot: snapshot.sku,
        nameSnapshot: snapshot.productName,
        orderedQty: input.orderedQty,
        shippedQty: 0,
        unitPriceMinor: input.unitPriceMinor,
      });
    }
    return lines;
  }

  private totals(lines: SalesOrderLine[]): OrderTotals {
    return computeOrderTotals(lines.map((line) => ({ quantity: line.orderedQty, unitMinor: line.unitPriceMinor })));
  }

  private async requireOrder(org: string, id: string): Promise<SalesOrderEntity> {
    const order = await this.repo.findById(org, id);
    if (!order) throw new ResourceNotFoundError('sales order', id);
    return order;
  }

  private async save(
    ctx: ActorContext,
    id: string,
    patch: Partial<SalesOrderEntity>,
  ): Promise<SalesOrderEntity> {
    const updated = await this.repo.update(ctx.organizationId, id, {
      ...patch,
      updatedAt: this.clock.now(),
      updatedBy: ctx.actorId,
    });
    if (!updated) throw new ResourceNotFoundError('sales order', id);
    return updated;
  }
}
