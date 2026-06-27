import type { CreateLocationRequest, LocationListQuery, UpdateLocationRequest } from '@stockflow/types';
import type { ActorContext } from '../../../common/auth/actor-context';
import {
  DuplicateResourceError,
  ResourceNotFoundError,
  nameKey,
  normalizeName,
  type ListResult,
  type ResourceAction,
  type ResourceClock,
  type ResourceEventPublisher,
  type ResourceIdGenerator,
} from '../../../common/resource';
import type { LocationEntity } from '../domain/entities';
import {
  InvalidParentLocationError,
  InvalidWarehouseError,
  LocationHasChildrenError,
} from '../domain/location.errors';
import type { LocationRepository, WarehouseRepository } from './ports';

/**
 * Location use cases — a per-warehouse Warehouse → Zone → … → Bin tree. Deliberately *not* on the shared
 * `ResourceService` base: codes are unique within a warehouse (not tenant-wide), names are not unique, and
 * the entity carries a materialized `path`. It composes the same primitives (id/clock/events) and reuses
 * the generic not-found / duplicate errors. Stock is tracked at a location id (Inventory module, later).
 */
export class LocationService {
  constructor(
    private readonly repo: LocationRepository,
    private readonly warehouses: WarehouseRepository,
    private readonly ids: ResourceIdGenerator,
    private readonly clock: ResourceClock,
    private readonly events: ResourceEventPublisher,
  ) {}

  async get(ctx: ActorContext, id: string): Promise<LocationEntity> {
    const found = await this.repo.findById(ctx.organizationId, id);
    if (!found) throw new ResourceNotFoundError('location', id);
    return found;
  }

  async list(ctx: ActorContext, query: LocationListQuery): Promise<ListResult<LocationEntity>> {
    const { items, total } = await this.repo.list(ctx.organizationId, query);
    return { items, total, page: query.page, limit: query.limit };
  }

  async create(ctx: ActorContext, input: CreateLocationRequest): Promise<LocationEntity> {
    const org = ctx.organizationId;
    await this.assertWarehouse(org, input.warehouseId);
    await this.assertCodeAvailable(org, input.warehouseId, input.code);
    const parentId = input.parentLocationId ?? null;
    const parent = parentId ? await this.assertParentValid(org, input.warehouseId, parentId) : null;
    const code = normalizeName(input.code);
    const now = this.clock.now();
    const created = await this.repo.insert({
      id: this.ids.generate(),
      organizationId: org,
      name: normalizeName(input.name),
      status: 'active',
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
      createdBy: ctx.actorId,
      updatedBy: ctx.actorId,
      warehouseId: input.warehouseId,
      parentLocationId: parentId,
      code,
      type: input.type,
      path: this.buildPath(parent, code),
    });
    this.emit('created', org, created.id);
    return created;
  }

  async update(ctx: ActorContext, id: string, input: UpdateLocationRequest): Promise<LocationEntity> {
    const org = ctx.organizationId;
    const existing = await this.requireLive(org, id);
    let code = existing.code;
    let parentId = existing.parentLocationId;
    let pathDirty = false;

    if (input.code !== undefined && nameKey(input.code) !== nameKey(existing.code)) {
      await this.assertCodeAvailable(org, existing.warehouseId, input.code, id);
    }
    const patch: Partial<LocationEntity> = {};
    if (input.name !== undefined) patch.name = normalizeName(input.name);
    if (input.type !== undefined) patch.type = input.type;
    if (input.code !== undefined) {
      code = normalizeName(input.code);
      patch.code = code;
      if (code !== existing.code) pathDirty = true;
    }
    if (input.parentLocationId !== undefined) {
      const next = input.parentLocationId ?? null;
      if (next !== existing.parentLocationId) {
        if (next) await this.assertParentValid(org, existing.warehouseId, next, id);
        parentId = next;
        patch.parentLocationId = next;
        pathDirty = true;
      }
    }
    if (pathDirty) {
      const parent = parentId ? await this.repo.findById(org, parentId) : null;
      patch.path = this.buildPath(parent, code);
    }
    const updated = await this.repo.update(org, id, this.stamp(ctx, patch));
    if (!updated) throw new ResourceNotFoundError('location', id);
    if (pathDirty) await this.recomputeDescendants(ctx, updated);
    this.emit('updated', org, id);
    return updated;
  }

  async archive(ctx: ActorContext, id: string): Promise<LocationEntity> {
    const updated = await this.setStatus(ctx, id, 'archived');
    this.emit('archived', ctx.organizationId, id);
    return updated;
  }

  async restore(ctx: ActorContext, id: string): Promise<LocationEntity> {
    const org = ctx.organizationId;
    const existing = await this.repo.findById(org, id, { withDeleted: true });
    if (!existing) throw new ResourceNotFoundError('location', id);
    await this.assertCodeAvailable(org, existing.warehouseId, existing.code, id);
    const updated = await this.repo.update(org, id, this.stamp(ctx, { status: 'active', deletedAt: null }));
    if (!updated) throw new ResourceNotFoundError('location', id);
    this.emit('restored', org, id);
    return updated;
  }

  async remove(ctx: ActorContext, id: string): Promise<void> {
    const org = ctx.organizationId;
    await this.requireLive(org, id);
    const children = await this.repo.findLiveChildren(org, id);
    if (children.length > 0) throw new LocationHasChildrenError();
    await this.repo.update(org, id, this.stamp(ctx, { deletedAt: this.clock.now() }));
    this.emit('deleted', org, id);
  }

  // ─── invariants ────────────────────────────────────────────────────────────
  private async assertWarehouse(org: string, warehouseId: string): Promise<void> {
    const warehouse = await this.warehouses.findById(org, warehouseId);
    if (!warehouse) throw new InvalidWarehouseError(`Warehouse "${warehouseId}" does not exist.`);
  }

  private async assertCodeAvailable(
    org: string,
    warehouseId: string,
    code: string,
    exceptId?: string,
  ): Promise<void> {
    const found = await this.repo.findLiveByCodeInWarehouse(org, warehouseId, code);
    if (found && found.id !== exceptId) {
      throw new DuplicateResourceError('location', 'code', normalizeName(code));
    }
  }

  /** Parent must exist (live, same tenant), be in the same warehouse, not be self, and not create a cycle. */
  private async assertParentValid(
    org: string,
    warehouseId: string,
    parentId: string,
    selfId?: string,
  ): Promise<LocationEntity> {
    if (selfId && parentId === selfId) {
      throw new InvalidParentLocationError('A location cannot be its own parent.');
    }
    const parent = await this.repo.findById(org, parentId);
    if (!parent) {
      throw new InvalidParentLocationError(`Parent location "${parentId}" does not exist.`);
    }
    if (parent.warehouseId !== warehouseId) {
      throw new InvalidParentLocationError('Parent location must be in the same warehouse.');
    }
    if (selfId) {
      const seen = new Set<string>();
      let cursor: LocationEntity | null = parent;
      while (cursor) {
        if (cursor.id === selfId) {
          throw new InvalidParentLocationError('Moving this location under its descendant would create a cycle.');
        }
        if (cursor.parentLocationId === null || seen.has(cursor.id)) break;
        seen.add(cursor.id);
        cursor = await this.repo.findById(org, cursor.parentLocationId);
      }
    }
    return parent;
  }

  // ─── path materialization ────────────────────────────────────────────────────
  private buildPath(parent: LocationEntity | null, code: string): string {
    return parent ? `${parent.path}/${code}` : code;
  }

  /** Re-materialize every live descendant's path after a node's code/parent changed (bounded subtree). */
  private async recomputeDescendants(ctx: ActorContext, parent: LocationEntity): Promise<void> {
    const children = await this.repo.findLiveChildren(ctx.organizationId, parent.id);
    for (const child of children) {
      const path = this.buildPath(parent, child.code);
      const updated = (await this.repo.update(ctx.organizationId, child.id, this.stamp(ctx, { path }))) ?? child;
      await this.recomputeDescendants(ctx, updated);
    }
  }

  // ─── shared lifecycle helpers (composed, not inherited) ──────────────────────
  private async requireLive(org: string, id: string): Promise<LocationEntity> {
    const existing = await this.repo.findById(org, id);
    if (!existing) throw new ResourceNotFoundError('location', id);
    return existing;
  }

  private async setStatus(ctx: ActorContext, id: string, status: LocationEntity['status']): Promise<LocationEntity> {
    const org = ctx.organizationId;
    await this.requireLive(org, id);
    const updated = await this.repo.update(org, id, this.stamp(ctx, { status }));
    if (!updated) throw new ResourceNotFoundError('location', id);
    return updated;
  }

  private stamp(ctx: ActorContext, patch: Partial<LocationEntity>): Partial<LocationEntity> {
    return { ...patch, updatedAt: this.clock.now(), updatedBy: ctx.actorId };
  }

  private emit(action: ResourceAction, organizationId: string, entityId: string): void {
    this.events.publish({ resource: 'location', action, organizationId, entityId });
  }
}
