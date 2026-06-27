import type {
  CreateReturnRequest,
  ReturnKind,
  ReturnLineInput,
  ReturnListQuery,
  UpdateReturnRequest,
} from '@stockflow/types';
import type { ActorContext } from '../../../common/auth/actor-context';
import {
  ResourceNotFoundError,
  type ListResult,
  type ResourceClock,
  type ResourceIdGenerator,
} from '../../../common/resource';
import type { ReturnEntity, ReturnLine } from '../domain/entities';
import {
  InvalidReturnLineError,
  InvalidReturnLocationError,
  InvalidReturnPartyError,
  ReturnStateError,
} from '../domain/returns.errors';
import type { CatalogRef, LocationRef, PartyRef, ReturnPoster, ReturnRepository } from './ports';

/**
 * Return use cases. Drafts are freely editable; **completing posts return movements into Inventory** — a
 * customer return brings stock back (`return_in`); a supplier return sends it back out (`return_out`,
 * negative-guarded). Lines snapshot the variant's sku/name at creation. Movements are idempotent on a
 * deterministic `opKey`.
 */
export class ReturnsService {
  constructor(
    private readonly repo: ReturnRepository,
    private readonly catalog: CatalogRef,
    private readonly parties: PartyRef,
    private readonly locations: LocationRef,
    private readonly poster: ReturnPoster,
    private readonly ids: ResourceIdGenerator,
    private readonly clock: ResourceClock,
  ) {}

  async get(ctx: ActorContext, id: string): Promise<ReturnEntity> {
    return this.requireReturn(ctx.organizationId, id);
  }

  async list(ctx: ActorContext, query: ReturnListQuery): Promise<ListResult<ReturnEntity>> {
    const { items, total } = await this.repo.list(ctx.organizationId, query);
    return { items, total, page: query.page, limit: query.limit };
  }

  async create(ctx: ActorContext, input: CreateReturnRequest): Promise<ReturnEntity> {
    const org = ctx.organizationId;
    if (!(await this.partyExists(org, input.kind, input.partyId))) {
      throw new InvalidReturnPartyError(input.partyId);
    }
    if (!(await this.locations.locationExists(org, input.locationId))) {
      throw new InvalidReturnLocationError(input.locationId);
    }
    const lines = await this.buildLines(org, input.lines);
    const now = this.clock.now();
    const ret: ReturnEntity = {
      id: this.ids.generate(),
      organizationId: org,
      returnNumber: await this.repo.nextNumber(org),
      kind: input.kind,
      partyId: input.partyId,
      partyName: await this.partyName(org, input.kind, input.partyId),
      locationId: input.locationId,
      status: 'draft',
      reason: input.reason ?? null,
      note: input.note ?? null,
      lines,
      createdAt: now,
      updatedAt: now,
      createdBy: ctx.actorId,
      updatedBy: ctx.actorId,
    };
    return this.repo.insert(ret);
  }

  async update(ctx: ActorContext, id: string, input: UpdateReturnRequest): Promise<ReturnEntity> {
    const org = ctx.organizationId;
    const existing = await this.requireReturn(org, id);
    if (existing.status !== 'draft') {
      throw new ReturnStateError('Only draft returns can be edited.');
    }
    const patch: Partial<ReturnEntity> = {};
    if (input.locationId !== undefined) {
      if (!(await this.locations.locationExists(org, input.locationId))) {
        throw new InvalidReturnLocationError(input.locationId);
      }
      patch.locationId = input.locationId;
    }
    if (input.reason !== undefined) patch.reason = input.reason;
    if (input.note !== undefined) patch.note = input.note;
    if (input.lines !== undefined) patch.lines = await this.buildLines(org, input.lines);
    return this.save(ctx, id, patch);
  }

  /**
   * Complete a draft return: post one return movement per line (inbound for a customer return, outbound for a
   * supplier return) and lock the document. Outbound is negative-guarded by Inventory (insufficient stock → 409).
   */
  async complete(ctx: ActorContext, id: string): Promise<ReturnEntity> {
    const existing = await this.requireReturn(ctx.organizationId, id);
    if (existing.status !== 'draft') {
      throw new ReturnStateError('Only draft returns can be completed.');
    }
    for (const line of existing.lines) {
      const cmd = {
        variantId: line.variantId,
        locationId: existing.locationId,
        quantity: line.quantity,
        refId: existing.id,
        lineId: line.id,
        opKey: `return:${existing.id}:${line.id}`,
      };
      if (existing.kind === 'customer') {
        await this.poster.returnInbound(ctx, cmd);
      } else {
        await this.poster.returnOutbound(ctx, cmd);
      }
    }
    return this.save(ctx, id, { status: 'completed' });
  }

  async cancel(ctx: ActorContext, id: string): Promise<ReturnEntity> {
    const existing = await this.requireReturn(ctx.organizationId, id);
    if (existing.status !== 'draft') {
      throw new ReturnStateError('Only draft returns can be cancelled.');
    }
    return this.save(ctx, id, { status: 'cancelled' });
  }

  // ─── helpers ─────────────────────────────────────────────────────────────────
  private partyExists(org: string, kind: ReturnKind, partyId: string): Promise<boolean> {
    return kind === 'customer'
      ? this.parties.customerExists(org, partyId)
      : this.parties.supplierExists(org, partyId);
  }

  private partyName(org: string, kind: ReturnKind, partyId: string): Promise<string | null> {
    return kind === 'customer'
      ? this.parties.getCustomerName(org, partyId)
      : this.parties.getSupplierName(org, partyId);
  }

  private async buildLines(org: string, inputs: ReturnLineInput[]): Promise<ReturnLine[]> {
    const lines: ReturnLine[] = [];
    for (const input of inputs) {
      const snapshot = await this.catalog.getVariantSnapshot(org, input.variantId);
      if (!snapshot) throw new InvalidReturnLineError(input.variantId);
      lines.push({
        id: this.ids.generate(),
        variantId: input.variantId,
        skuSnapshot: snapshot.sku,
        nameSnapshot: snapshot.productName,
        quantity: input.quantity,
      });
    }
    return lines;
  }

  private async requireReturn(org: string, id: string): Promise<ReturnEntity> {
    const ret = await this.repo.findById(org, id);
    if (!ret) throw new ResourceNotFoundError('return', id);
    return ret;
  }

  private async save(
    ctx: ActorContext,
    id: string,
    patch: Partial<ReturnEntity>,
  ): Promise<ReturnEntity> {
    const updated = await this.repo.update(ctx.organizationId, id, {
      ...patch,
      updatedAt: this.clock.now(),
      updatedBy: ctx.actorId,
    });
    if (!updated) throw new ResourceNotFoundError('return', id);
    return updated;
  }
}
