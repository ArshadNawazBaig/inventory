import type {
  CreateBrandRequest,
  CreateCategoryRequest,
  CreateUnitRequest,
  LookupListQuery,
  UpdateBrandRequest,
  UpdateCategoryRequest,
  UpdateUnitRequest,
} from '@stockflow/types';
import type { ActorContext } from '../../../common/auth/actor-context';
import type {
  BrandEntity,
  CategoryEntity,
  LookupAction,
  LookupEntity,
  LookupResource,
  UnitEntity,
} from '../domain/entities';
import { DuplicateLookupError, InvalidParentError, LookupNotFoundError } from '../domain/lookup.errors';
import { codeKey, nameKey, normalizeName } from '../domain/name';
import type {
  Clock,
  IdGenerator,
  LookupEventPublisher,
  LookupRepository,
  UnitRepository,
} from './ports';

export interface ListResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}

/**
 * Shared use cases for every catalog lookup (framework-free). Holds the invariants common to all three —
 * name uniqueness, status transitions, soft-delete/restore — and the standard read/list paths. Concrete
 * services add their type-specific rules (category parent/cycle, unit code uniqueness).
 */
export abstract class LookupService<T extends LookupEntity> {
  protected constructor(
    protected readonly resource: LookupResource,
    protected readonly repo: LookupRepository<T>,
    protected readonly ids: IdGenerator,
    protected readonly clock: Clock,
    protected readonly events: LookupEventPublisher,
  ) {}

  async get(ctx: ActorContext, id: string): Promise<T> {
    const found = await this.repo.findById(ctx.organizationId, id);
    if (!found) throw new LookupNotFoundError(this.resource, id);
    return found;
  }

  async list(ctx: ActorContext, query: LookupListQuery): Promise<ListResult<T>> {
    const { items, total } = await this.repo.list(ctx.organizationId, query);
    return { items, total, page: query.page, limit: query.limit };
  }

  async archive(ctx: ActorContext, id: string): Promise<T> {
    const updated = await this.setStatus(ctx, id, 'archived');
    this.emit('archived', ctx.organizationId, id);
    return updated;
  }

  async restore(ctx: ActorContext, id: string): Promise<T> {
    const org = ctx.organizationId;
    const existing = await this.repo.findById(org, id, { withDeleted: true });
    if (!existing) throw new LookupNotFoundError(this.resource, id);
    // A restored name must not collide with one taken while it was gone.
    await this.assertNameAvailable(org, existing.name, id);
    const updated = await this.repo.update(
      org,
      id,
      this.stamp(ctx, { status: 'active', deletedAt: null } as Partial<T>),
    );
    if (!updated) throw new LookupNotFoundError(this.resource, id);
    this.emit('restored', org, id);
    return updated;
  }

  async remove(ctx: ActorContext, id: string): Promise<void> {
    const org = ctx.organizationId;
    const existing = await this.repo.findById(org, id);
    if (!existing) throw new LookupNotFoundError(this.resource, id);
    await this.repo.update(org, id, this.stamp(ctx, { deletedAt: this.clock.now() } as Partial<T>));
    this.emit('deleted', org, id);
  }

  // ─── helpers for concrete services ─────────────────────────────────────────
  protected async assertNameAvailable(org: string, name: string, exceptId?: string): Promise<void> {
    const existing = await this.repo.findLiveByName(org, name);
    if (existing && existing.id !== exceptId) {
      throw new DuplicateLookupError(this.resource, 'name', normalizeName(name));
    }
  }

  protected envelope(ctx: ActorContext, now: Date): Omit<LookupEntity, 'name' | 'description'> {
    return {
      id: this.ids.generate(),
      organizationId: ctx.organizationId,
      status: 'active',
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
      createdBy: ctx.actorId,
      updatedBy: ctx.actorId,
    };
  }

  protected stamp(ctx: ActorContext, patch: Partial<T>): Partial<T> {
    return { ...patch, updatedAt: this.clock.now(), updatedBy: ctx.actorId };
  }

  protected emit(action: LookupAction, organizationId: string, entityId: string): void {
    this.events.publish({ resource: this.resource, action, organizationId, entityId });
  }

  protected async requireLive(org: string, id: string): Promise<T> {
    const existing = await this.repo.findById(org, id);
    if (!existing) throw new LookupNotFoundError(this.resource, id);
    return existing;
  }

  private async setStatus(ctx: ActorContext, id: string, status: T['status']): Promise<T> {
    const org = ctx.organizationId;
    await this.requireLive(org, id);
    const updated = await this.repo.update(org, id, this.stamp(ctx, { status } as Partial<T>));
    if (!updated) throw new LookupNotFoundError(this.resource, id);
    return updated;
  }
}

// ─── Category ──────────────────────────────────────────────────────────────────
export class CategoryService extends LookupService<CategoryEntity> {
  constructor(
    repo: LookupRepository<CategoryEntity>,
    ids: IdGenerator,
    clock: Clock,
    events: LookupEventPublisher,
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
    if (!updated) throw new LookupNotFoundError('category', id);
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
export class BrandService extends LookupService<BrandEntity> {
  constructor(
    repo: LookupRepository<BrandEntity>,
    ids: IdGenerator,
    clock: Clock,
    events: LookupEventPublisher,
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
    if (!updated) throw new LookupNotFoundError('brand', id);
    this.emit('updated', org, id);
    return updated;
  }
}

// ─── Unit ─────────────────────────────────────────────────────────────────────
export class UnitService extends LookupService<UnitEntity> {
  constructor(
    private readonly units: UnitRepository,
    ids: IdGenerator,
    clock: Clock,
    events: LookupEventPublisher,
  ) {
    super('unit', units, ids, clock, events);
  }

  async create(ctx: ActorContext, input: CreateUnitRequest): Promise<UnitEntity> {
    const org = ctx.organizationId;
    await this.assertNameAvailable(org, input.name);
    await this.assertCodeAvailable(org, input.code);
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
    if (input.code !== undefined && codeKey(input.code) !== codeKey(existing.code)) {
      await this.assertCodeAvailable(org, input.code, id);
    }
    if (input.name !== undefined) patch.name = normalizeName(input.name);
    if (input.description !== undefined) patch.description = input.description;
    if (input.code !== undefined) patch.code = normalizeName(input.code);
    const updated = await this.repo.update(org, id, this.stamp(ctx, patch));
    if (!updated) throw new LookupNotFoundError('unit', id);
    this.emit('updated', org, id);
    return updated;
  }

  private async assertCodeAvailable(org: string, code: string, exceptId?: string): Promise<void> {
    const existing = await this.units.findLiveByCode(org, code);
    if (existing && existing.id !== exceptId) {
      throw new DuplicateLookupError('unit', 'code', normalizeName(code));
    }
  }
}
