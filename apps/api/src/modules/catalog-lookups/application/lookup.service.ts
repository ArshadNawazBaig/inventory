import type {
  CreateBrandRequest,
  CreateCategoryRequest,
  CreateUnitRequest,
  UpdateBrandRequest,
  UpdateCategoryRequest,
  UpdateUnitRequest,
} from '@stockflow/types';
import type { ActorContext } from '../../../common/auth/actor-context';
import {
  ResourceService,
  ResourceNotFoundError,
  nameKey,
  normalizeName,
  type ResourceClock,
  type ResourceEventPublisher,
  type ResourceIdGenerator,
  type ResourceRepository,
} from '../../../common/resource';
import type { BrandEntity, CategoryEntity, UnitEntity } from '../domain/entities';
import { InvalidParentError } from '../domain/lookup.errors';

// ─── Category ──────────────────────────────────────────────────────────────────
export class CategoryService extends ResourceService<CategoryEntity> {
  constructor(
    repo: ResourceRepository<CategoryEntity>,
    ids: ResourceIdGenerator,
    clock: ResourceClock,
    events: ResourceEventPublisher,
  ) {
    super('category', repo, ids, clock, events);
  }

  async create(ctx: ActorContext, input: CreateCategoryRequest): Promise<CategoryEntity> {
    const org = ctx.organizationId;
    await this.assertNameAvailable(org, input.name);
    const parentId = input.parentId ?? null;
    if (parentId) await this.assertParentValid(org, parentId);
    const created = await this.repo.insert({
      ...this.envelope(ctx, this.clock.now()),
      name: normalizeName(input.name),
      description: input.description ?? null,
      parentId,
    });
    this.emit('created', org, created.id);
    return created;
  }

  async update(ctx: ActorContext, id: string, input: UpdateCategoryRequest): Promise<CategoryEntity> {
    const org = ctx.organizationId;
    const existing = await this.requireLive(org, id);
    const patch: Partial<CategoryEntity> = {};
    if (input.name !== undefined && nameKey(input.name) !== nameKey(existing.name)) {
      await this.assertNameAvailable(org, input.name, id);
    }
    if (input.name !== undefined) patch.name = normalizeName(input.name);
    if (input.description !== undefined) patch.description = input.description;
    if (input.parentId !== undefined) {
      if (input.parentId) await this.assertParentValid(org, input.parentId, id);
      patch.parentId = input.parentId;
    }
    const updated = await this.repo.update(org, id, this.stamp(ctx, patch));
    if (!updated) throw new ResourceNotFoundError('category', id);
    this.emit('updated', org, id);
    return updated;
  }

  /** Parent must exist (live, same tenant), not be self, and not create a cycle. */
  private async assertParentValid(org: string, parentId: string, selfId?: string): Promise<void> {
    if (selfId && parentId === selfId) {
      throw new InvalidParentError('A category cannot be its own parent.');
    }
    const parent = await this.repo.findById(org, parentId);
    if (!parent) {
      throw new InvalidParentError(`Parent category "${parentId}" does not exist.`);
    }
    if (selfId) {
      const seen = new Set<string>();
      let cursor: CategoryEntity | null = parent;
      while (cursor) {
        if (cursor.id === selfId) {
          throw new InvalidParentError('Moving this category under its descendant would create a cycle.');
        }
        if (cursor.parentId === null || seen.has(cursor.id)) break;
        seen.add(cursor.id);
        cursor = await this.repo.findById(org, cursor.parentId);
      }
    }
  }
}

// ─── Brand ──────────────────────────────────────────────────────────────────────
export class BrandService extends ResourceService<BrandEntity> {
  constructor(
    repo: ResourceRepository<BrandEntity>,
    ids: ResourceIdGenerator,
    clock: ResourceClock,
    events: ResourceEventPublisher,
  ) {
    super('brand', repo, ids, clock, events);
  }

  async create(ctx: ActorContext, input: CreateBrandRequest): Promise<BrandEntity> {
    const org = ctx.organizationId;
    await this.assertNameAvailable(org, input.name);
    const created = await this.repo.insert({
      ...this.envelope(ctx, this.clock.now()),
      name: normalizeName(input.name),
      description: input.description ?? null,
      website: input.website ?? null,
    });
    this.emit('created', org, created.id);
    return created;
  }

  async update(ctx: ActorContext, id: string, input: UpdateBrandRequest): Promise<BrandEntity> {
    const org = ctx.organizationId;
    const existing = await this.requireLive(org, id);
    const patch: Partial<BrandEntity> = {};
    if (input.name !== undefined && nameKey(input.name) !== nameKey(existing.name)) {
      await this.assertNameAvailable(org, input.name, id);
    }
    if (input.name !== undefined) patch.name = normalizeName(input.name);
    if (input.description !== undefined) patch.description = input.description;
    if (input.website !== undefined) patch.website = input.website;
    const updated = await this.repo.update(org, id, this.stamp(ctx, patch));
    if (!updated) throw new ResourceNotFoundError('brand', id);
    this.emit('updated', org, id);
    return updated;
  }
}

// ─── Unit ─────────────────────────────────────────────────────────────────────
export class UnitService extends ResourceService<UnitEntity> {
  constructor(
    repo: ResourceRepository<UnitEntity>,
    ids: ResourceIdGenerator,
    clock: ResourceClock,
    events: ResourceEventPublisher,
  ) {
    super('unit', repo, ids, clock, events);
  }

  async create(ctx: ActorContext, input: CreateUnitRequest): Promise<UnitEntity> {
    const org = ctx.organizationId;
    await this.assertNameAvailable(org, input.name);
    await this.assertFieldAvailable(org, 'code', input.code);
    const created = await this.repo.insert({
      ...this.envelope(ctx, this.clock.now()),
      name: normalizeName(input.name),
      description: input.description ?? null,
      code: normalizeName(input.code),
    });
    this.emit('created', org, created.id);
    return created;
  }

  async update(ctx: ActorContext, id: string, input: UpdateUnitRequest): Promise<UnitEntity> {
    const org = ctx.organizationId;
    const existing = await this.requireLive(org, id);
    const patch: Partial<UnitEntity> = {};
    if (input.name !== undefined && nameKey(input.name) !== nameKey(existing.name)) {
      await this.assertNameAvailable(org, input.name, id);
    }
    if (input.code !== undefined && nameKey(input.code) !== nameKey(existing.code)) {
      await this.assertFieldAvailable(org, 'code', input.code, id);
    }
    if (input.name !== undefined) patch.name = normalizeName(input.name);
    if (input.description !== undefined) patch.description = input.description;
    if (input.code !== undefined) patch.code = normalizeName(input.code);
    const updated = await this.repo.update(org, id, this.stamp(ctx, patch));
    if (!updated) throw new ResourceNotFoundError('unit', id);
    this.emit('updated', org, id);
    return updated;
  }
}
