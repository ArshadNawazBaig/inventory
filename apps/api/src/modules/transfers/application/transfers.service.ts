import type {
  CreateTransferRequest,
  ReceiveTransferRequest,
  TransferLineInput,
  TransferListQuery,
  UpdateTransferRequest,
} from '@stockflow/types';
import type { ActorContext } from '../../../common/auth/actor-context';
import {
  ResourceNotFoundError,
  type ListResult,
  type ResourceClock,
  type ResourceIdGenerator,
} from '../../../common/resource';
import type { TransferEntity, TransferLine } from '../domain/entities';
import {
  InvalidTransferLineError,
  InvalidTransferLocationError,
  OverReceiveTransferError,
  SameLocationError,
  TransferStateError,
  UnknownTransferLineError,
} from '../domain/transfers.errors';
import type { CatalogRef, LocationRef, StockMover, TransferRepository } from './ports';

/**
 * Transfer use cases. Drafts are freely editable; **dispatch posts `transfer_out`** at the source (capturing the
 * source's running average onto each line); **receive posts `transfer_in`** at the destination (at that captured
 * cost, so value moves with the goods). Both legs are idempotent on a deterministic `opKey`. Inventory is the
 * only ledger writer and applies the negative-stock guard at dispatch.
 */
export class TransfersService {
  constructor(
    private readonly repo: TransferRepository,
    private readonly catalog: CatalogRef,
    private readonly locations: LocationRef,
    private readonly mover: StockMover,
    private readonly ids: ResourceIdGenerator,
    private readonly clock: ResourceClock,
  ) {}

  async get(ctx: ActorContext, id: string): Promise<TransferEntity> {
    return this.requireTransfer(ctx.organizationId, id);
  }

  async list(ctx: ActorContext, query: TransferListQuery): Promise<ListResult<TransferEntity>> {
    const { items, total } = await this.repo.list(ctx.organizationId, query);
    return { items, total, page: query.page, limit: query.limit };
  }

  async create(ctx: ActorContext, input: CreateTransferRequest): Promise<TransferEntity> {
    const org = ctx.organizationId;
    if (input.sourceLocationId === input.destinationLocationId) throw new SameLocationError();
    await this.assertLocation(org, 'sourceLocationId', input.sourceLocationId);
    await this.assertLocation(org, 'destinationLocationId', input.destinationLocationId);

    const lines = await this.buildLines(org, input.lines);
    const now = this.clock.now();
    const transfer: TransferEntity = {
      id: this.ids.generate(),
      organizationId: org,
      transferNumber: await this.repo.nextNumber(org),
      sourceLocationId: input.sourceLocationId,
      sourceLocationName: await this.locations.getLocationLabel(org, input.sourceLocationId),
      destinationLocationId: input.destinationLocationId,
      destinationLocationName: await this.locations.getLocationLabel(org, input.destinationLocationId),
      status: 'draft',
      note: input.note ?? null,
      lines,
      createdAt: now,
      updatedAt: now,
      createdBy: ctx.actorId,
      updatedBy: ctx.actorId,
    };
    return this.repo.insert(transfer);
  }

  async update(ctx: ActorContext, id: string, input: UpdateTransferRequest): Promise<TransferEntity> {
    const org = ctx.organizationId;
    const existing = await this.requireTransfer(org, id);
    if (existing.status !== 'draft') {
      throw new TransferStateError('Only draft transfers can be edited.');
    }
    const patch: Partial<TransferEntity> = {};
    const nextSource = input.sourceLocationId ?? existing.sourceLocationId;
    const nextDestination = input.destinationLocationId ?? existing.destinationLocationId;
    if (nextSource === nextDestination) throw new SameLocationError();

    if (input.sourceLocationId !== undefined) {
      await this.assertLocation(org, 'sourceLocationId', input.sourceLocationId);
      patch.sourceLocationId = input.sourceLocationId;
      patch.sourceLocationName = await this.locations.getLocationLabel(org, input.sourceLocationId);
    }
    if (input.destinationLocationId !== undefined) {
      await this.assertLocation(org, 'destinationLocationId', input.destinationLocationId);
      patch.destinationLocationId = input.destinationLocationId;
      patch.destinationLocationName = await this.locations.getLocationLabel(org, input.destinationLocationId);
    }
    if (input.note !== undefined) patch.note = input.note;
    if (input.lines !== undefined) patch.lines = await this.buildLines(org, input.lines);
    return this.save(ctx, id, patch);
  }

  /** Dispatch a draft: post a `transfer_out` per line (negative-guarded), capture the source cost, go in transit. */
  async dispatch(ctx: ActorContext, id: string): Promise<TransferEntity> {
    const existing = await this.requireTransfer(ctx.organizationId, id);
    if (existing.status !== 'draft') {
      throw new TransferStateError('Only draft transfers can be dispatched.');
    }
    const lines = existing.lines.map((line) => ({ ...line }));
    for (const line of lines) {
      const { unitCostMinor, currency } = await this.mover.transferOut(ctx, {
        variantId: line.variantId,
        locationId: existing.sourceLocationId,
        quantity: line.quantity,
        refId: existing.id,
        lineId: line.id,
        opKey: `transfer:${existing.id}:${line.id}:out`,
      });
      line.dispatchedQty = line.quantity;
      line.unitCostMinor = unitCostMinor;
      line.currency = currency;
    }
    return this.save(ctx, id, { lines, status: 'in_transit' });
  }

  /** Receive in-transit stock: validate against the outstanding in-transit qty, post `transfer_in` per line. */
  async receive(ctx: ActorContext, id: string, input: ReceiveTransferRequest): Promise<TransferEntity> {
    const existing = await this.requireTransfer(ctx.organizationId, id);
    if (existing.status !== 'in_transit' && existing.status !== 'partially_received') {
      throw new TransferStateError('Only in-transit transfers can be received.');
    }

    const lines = existing.lines.map((line) => ({ ...line }));
    const byId = new Map(lines.map((line) => [line.id, line]));

    // Validate every requested receipt before posting any movement.
    for (const request of input.lines) {
      const line = byId.get(request.lineId);
      if (!line) throw new UnknownTransferLineError(request.lineId);
      const inTransit = line.dispatchedQty - line.receivedQty;
      if (request.quantity > inTransit) throw new OverReceiveTransferError(line.id, inTransit);
    }

    // Post the inbound legs (idempotent on opKey) at the captured source cost, and advance the lines.
    for (const request of input.lines) {
      const line = byId.get(request.lineId)!;
      const newReceived = line.receivedQty + request.quantity;
      await this.mover.transferIn(ctx, {
        variantId: line.variantId,
        locationId: existing.destinationLocationId,
        quantity: request.quantity,
        unitCostMinor: line.unitCostMinor,
        currency: line.currency,
        refId: existing.id,
        lineId: line.id,
        opKey: `transfer:${existing.id}:${line.id}:in:${newReceived}`,
      });
      line.receivedQty = newReceived;
    }

    const status = lines.every((line) => line.receivedQty >= line.dispatchedQty)
      ? 'completed'
      : 'partially_received';
    return this.save(ctx, id, { lines, status });
  }

  async cancel(ctx: ActorContext, id: string): Promise<TransferEntity> {
    const existing = await this.requireTransfer(ctx.organizationId, id);
    if (existing.status !== 'draft') {
      throw new TransferStateError('Only draft transfers can be cancelled (dispatched stock must be received).');
    }
    return this.save(ctx, id, { status: 'cancelled' });
  }

  // ─── helpers ─────────────────────────────────────────────────────────────────
  private async assertLocation(
    org: string,
    field: 'sourceLocationId' | 'destinationLocationId',
    locationId: string,
  ): Promise<void> {
    if (!(await this.locations.locationExists(org, locationId))) {
      throw new InvalidTransferLocationError(field, locationId);
    }
  }

  private async buildLines(org: string, inputs: TransferLineInput[]): Promise<TransferLine[]> {
    const lines: TransferLine[] = [];
    for (const input of inputs) {
      const snapshot = await this.catalog.getVariantSnapshot(org, input.variantId);
      if (!snapshot) throw new InvalidTransferLineError(input.variantId);
      lines.push({
        id: this.ids.generate(),
        variantId: input.variantId,
        skuSnapshot: snapshot.sku,
        nameSnapshot: snapshot.productName,
        quantity: input.quantity,
        dispatchedQty: 0,
        receivedQty: 0,
        unitCostMinor: null,
        currency: null,
      });
    }
    return lines;
  }

  private async requireTransfer(org: string, id: string): Promise<TransferEntity> {
    const transfer = await this.repo.findById(org, id);
    if (!transfer) throw new ResourceNotFoundError('transfer', id);
    return transfer;
  }

  private async save(
    ctx: ActorContext,
    id: string,
    patch: Partial<TransferEntity>,
  ): Promise<TransferEntity> {
    const updated = await this.repo.update(ctx.organizationId, id, {
      ...patch,
      updatedAt: this.clock.now(),
      updatedBy: ctx.actorId,
    });
    if (!updated) throw new ResourceNotFoundError('transfer', id);
    return updated;
  }
}
