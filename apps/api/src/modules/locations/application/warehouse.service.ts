import type { CreateWarehouseRequest, UpdateWarehouseRequest } from '@stockflow/types';
import type { ActorContext } from '../../../common/auth/actor-context';
import { buildAddress } from '../../../common/address';
import {
  ResourceNotFoundError,
  ResourceService,
  nameKey,
  normalizeName,
  type ResourceClock,
  type ResourceEventPublisher,
  type ResourceIdGenerator,
} from '../../../common/resource';
import type { WarehouseEntity } from '../domain/entities';
import type { WarehouseRepository } from './ports';

/**
 * Warehouses on the shared resource base: keyed by an optional unique `code` (names are NOT unique, like
 * parties), carry an embedded address, and hold the single-default-per-tenant invariant. Restore re-checks
 * the code; setting `isDefault` demotes the previous default.
 */
export class WarehouseService extends ResourceService<WarehouseEntity> {
  constructor(
    private readonly warehouses: WarehouseRepository,
    ids: ResourceIdGenerator,
    clock: ResourceClock,
    events: ResourceEventPublisher,
  ) {
    super('warehouse', warehouses, ids, clock, events);
  }

  protected override async assertRestorable(org: string, existing: WarehouseEntity, id: string): Promise<void> {
    if (existing.code) await this.assertFieldAvailable(org, 'code', existing.code, id);
  }

  async create(ctx: ActorContext, input: CreateWarehouseRequest): Promise<WarehouseEntity> {
    const org = ctx.organizationId;
    if (input.code) await this.assertFieldAvailable(org, 'code', input.code);
    const isDefault = input.isDefault ?? false;
    if (isDefault) await this.clearDefault(ctx);
    const created = await this.warehouses.insert({
      ...this.envelope(ctx, this.clock.now()),
      name: normalizeName(input.name),
      type: input.type ?? 'warehouse',
      code: input.code ?? null,
      address: buildAddress(input.address),
      isDefault,
    });
    this.emit('created', org, created.id);
    return created;
  }

  async update(ctx: ActorContext, id: string, input: UpdateWarehouseRequest): Promise<WarehouseEntity> {
    const org = ctx.organizationId;
    const existing = await this.requireLive(org, id);
    const currentCode = existing.code ? nameKey(existing.code) : '';
    if (input.code && nameKey(input.code) !== currentCode) {
      await this.assertFieldAvailable(org, 'code', input.code, id);
    }
    if (input.isDefault === true) await this.clearDefault(ctx, id);
    const patch: Partial<WarehouseEntity> = {};
    if (input.name !== undefined) patch.name = normalizeName(input.name);
    if (input.type !== undefined) patch.type = input.type;
    if (input.code !== undefined) patch.code = input.code;
    if (input.address !== undefined) patch.address = input.address ? buildAddress(input.address) : null;
    if (input.isDefault !== undefined) patch.isDefault = input.isDefault;
    const updated = await this.warehouses.update(org, id, this.stamp(ctx, patch));
    if (!updated) throw new ResourceNotFoundError('warehouse', id);
    this.emit('updated', org, id);
    return updated;
  }

  /** Enforce at-most-one default: clear the current default (other than `exceptId`) before promoting one. */
  private async clearDefault(ctx: ActorContext, exceptId?: string): Promise<void> {
    const current = await this.warehouses.findDefault(ctx.organizationId);
    if (current && current.id !== exceptId) {
      await this.warehouses.update(ctx.organizationId, current.id, this.stamp(ctx, { isDefault: false }));
    }
  }
}
