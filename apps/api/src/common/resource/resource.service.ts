import type { LookupListQuery } from '@stockflow/types';
import type { ActorContext } from '../auth/actor-context';
import type { ResourceAction, ResourceEntity } from './resource.entity';
import { DuplicateResourceError, ResourceNotFoundError } from './resource.errors';
import { normalizeName } from './name';
import type {
  ResourceClock,
  ResourceEventPublisher,
  ResourceIdGenerator,
  ResourceRepository,
} from './resource.ports';

export interface ListResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}

/**
 * Shared use cases for any managed resource (framework-free). Holds the invariants common to all —
 * name uniqueness, status transitions, soft-delete/restore — and the standard read/list paths. Concrete
 * services add their type-specific rules (e.g. category parent/cycle, code uniqueness via
 * {@link assertFieldAvailable}).
 */
export abstract class ResourceService<T extends ResourceEntity> {
  protected constructor(
    protected readonly resource: string,
    protected readonly repo: ResourceRepository<T>,
    protected readonly ids: ResourceIdGenerator,
    protected readonly clock: ResourceClock,
    protected readonly events: ResourceEventPublisher,
  ) {}

  async get(ctx: ActorContext, id: string): Promise<T> {
    const found = await this.repo.findById(ctx.organizationId, id);
    if (!found) throw new ResourceNotFoundError(this.resource, id);
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
    if (!existing) throw new ResourceNotFoundError(this.resource, id);
    // A restored row must not collide with a unique value taken while it was gone.
    await this.assertRestorable(org, existing, id);
    const updated = await this.repo.update(
      org,
      id,
      this.stamp(ctx, { status: 'active', deletedAt: null } as Partial<T>),
    );
    if (!updated) throw new ResourceNotFoundError(this.resource, id);
    this.emit('restored', org, id);
    return updated;
  }

  async remove(ctx: ActorContext, id: string): Promise<void> {
    const org = ctx.organizationId;
    const existing = await this.repo.findById(org, id);
    if (!existing) throw new ResourceNotFoundError(this.resource, id);
    await this.repo.update(org, id, this.stamp(ctx, { deletedAt: this.clock.now() } as Partial<T>));
    this.emit('deleted', org, id);
  }

  /**
   * Re-check uniqueness when restoring a soft-deleted row. Default: the name must be free (resources
   * with unique names). Override for resources whose uniqueness is on another field (e.g. parties keyed
   * by `code`, whose names are not unique).
   */
  protected async assertRestorable(org: string, existing: T, id: string): Promise<void> {
    await this.assertNameAvailable(org, existing.name, id);
  }

  // ─── helpers for concrete services ─────────────────────────────────────────
  protected async assertNameAvailable(org: string, name: string, exceptId?: string): Promise<void> {
    const existing = await this.repo.findLiveByName(org, name);
    if (existing && existing.id !== exceptId) {
      throw new DuplicateResourceError(this.resource, 'name', normalizeName(name));
    }
  }

  /** Enforce uniqueness of another string field (e.g. `code`) among live rows in the tenant. */
  protected async assertFieldAvailable(
    org: string,
    field: string,
    value: string,
    exceptId?: string,
  ): Promise<void> {
    const existing = await this.repo.findLiveByField(org, field, value);
    if (existing && existing.id !== exceptId) {
      throw new DuplicateResourceError(this.resource, field, normalizeName(value));
    }
  }

  protected envelope(ctx: ActorContext, now: Date): Omit<ResourceEntity, 'name'> {
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

  protected emit(action: ResourceAction, organizationId: string, entityId: string): void {
    this.events.publish({ resource: this.resource, action, organizationId, entityId });
  }

  protected async requireLive(org: string, id: string): Promise<T> {
    const existing = await this.repo.findById(org, id);
    if (!existing) throw new ResourceNotFoundError(this.resource, id);
    return existing;
  }

  private async setStatus(ctx: ActorContext, id: string, status: T['status']): Promise<T> {
    const org = ctx.organizationId;
    await this.requireLive(org, id);
    const updated = await this.repo.update(org, id, this.stamp(ctx, { status } as Partial<T>));
    if (!updated) throw new ResourceNotFoundError(this.resource, id);
    return updated;
  }
}
