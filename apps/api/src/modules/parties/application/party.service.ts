import type {
  CreateCustomerRequest,
  CreateSupplierRequest,
  UpdateCustomerRequest,
  UpdateSupplierRequest,
} from '@stockflow/types';
import type { ActorContext } from '../../../common/auth/actor-context';
import {
  ResourceNotFoundError,
  ResourceService,
  nameKey,
  normalizeName,
  type ResourceClock,
  type ResourceEventPublisher,
  type ResourceIdGenerator,
  type ResourceRepository,
} from '../../../common/resource';
import type { CustomerEntity, PartyEntity, SupplierEntity } from '../domain/entities';
import { applyPartyUpdate, partyCreateFields } from './party-fields';

/**
 * Shared party behaviour on top of the generic resource base: parties are keyed by an optional unique
 * `code` (their names are NOT unique), so restore re-checks code availability and updates re-check it
 * when it changes.
 */
abstract class PartyService<T extends PartyEntity> extends ResourceService<T> {
  protected override async assertRestorable(org: string, existing: T, id: string): Promise<void> {
    if (existing.code) await this.assertFieldAvailable(org, 'code', existing.code, id);
  }

  protected async assertCodeOnChange(
    org: string,
    existing: T,
    code: string | null | undefined,
    id: string,
  ): Promise<void> {
    const current = existing.code ? nameKey(existing.code) : '';
    if (code && nameKey(code) !== current) {
      await this.assertFieldAvailable(org, 'code', code, id);
    }
  }
}

// ─── Supplier ───────────────────────────────────────────────────────────────────
export class SupplierService extends PartyService<SupplierEntity> {
  constructor(
    repo: ResourceRepository<SupplierEntity>,
    ids: ResourceIdGenerator,
    clock: ResourceClock,
    events: ResourceEventPublisher,
  ) {
    super('supplier', repo, ids, clock, events);
  }

  async create(ctx: ActorContext, input: CreateSupplierRequest): Promise<SupplierEntity> {
    const org = ctx.organizationId;
    if (input.code) await this.assertFieldAvailable(org, 'code', input.code);
    const created = await this.repo.insert({
      ...this.envelope(ctx, this.clock.now()),
      name: normalizeName(input.name),
      ...partyCreateFields(input),
      currency: input.currency ?? null,
      paymentTerms: input.paymentTerms ?? null,
      leadTimeDays: input.leadTimeDays ?? null,
    });
    this.emit('created', org, created.id);
    return created;
  }

  async update(ctx: ActorContext, id: string, input: UpdateSupplierRequest): Promise<SupplierEntity> {
    const org = ctx.organizationId;
    const existing = await this.requireLive(org, id);
    await this.assertCodeOnChange(org, existing, input.code, id);
    const patch: Partial<SupplierEntity> = {};
    if (input.name !== undefined) patch.name = normalizeName(input.name);
    applyPartyUpdate(patch, input);
    if (input.currency !== undefined) patch.currency = input.currency;
    if (input.paymentTerms !== undefined) patch.paymentTerms = input.paymentTerms;
    if (input.leadTimeDays !== undefined) patch.leadTimeDays = input.leadTimeDays;
    const updated = await this.repo.update(org, id, this.stamp(ctx, patch));
    if (!updated) throw new ResourceNotFoundError('supplier', id);
    this.emit('updated', org, id);
    return updated;
  }
}

// ─── Customer ────────────────────────────────────────────────────────────────
export class CustomerService extends PartyService<CustomerEntity> {
  constructor(
    repo: ResourceRepository<CustomerEntity>,
    ids: ResourceIdGenerator,
    clock: ResourceClock,
    events: ResourceEventPublisher,
  ) {
    super('customer', repo, ids, clock, events);
  }

  async create(ctx: ActorContext, input: CreateCustomerRequest): Promise<CustomerEntity> {
    const org = ctx.organizationId;
    if (input.code) await this.assertFieldAvailable(org, 'code', input.code);
    const created = await this.repo.insert({
      ...this.envelope(ctx, this.clock.now()),
      name: normalizeName(input.name),
      ...partyCreateFields(input),
      customerType: input.customerType,
      creditLimitMinor: input.creditLimitMinor ?? null,
      currency: input.currency ?? null,
    });
    this.emit('created', org, created.id);
    return created;
  }

  async update(ctx: ActorContext, id: string, input: UpdateCustomerRequest): Promise<CustomerEntity> {
    const org = ctx.organizationId;
    const existing = await this.requireLive(org, id);
    await this.assertCodeOnChange(org, existing, input.code, id);
    const patch: Partial<CustomerEntity> = {};
    if (input.name !== undefined) patch.name = normalizeName(input.name);
    applyPartyUpdate(patch, input);
    if (input.customerType !== undefined) patch.customerType = input.customerType;
    if (input.creditLimitMinor !== undefined) patch.creditLimitMinor = input.creditLimitMinor;
    if (input.currency !== undefined) patch.currency = input.currency;
    const updated = await this.repo.update(org, id, this.stamp(ctx, patch));
    if (!updated) throw new ResourceNotFoundError('customer', id);
    this.emit('updated', org, id);
    return updated;
  }
}
