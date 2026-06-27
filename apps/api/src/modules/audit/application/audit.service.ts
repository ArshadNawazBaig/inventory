import type { AuditLogListQuery } from '@stockflow/types';
import type { ActorContext } from '../../../common/auth/actor-context';
import type { AuditRecordInput, AuditRecorder } from '../../../common/audit/audit-recorder';
import type { ListResult, ResourceClock, ResourceIdGenerator } from '../../../common/resource';
import { ResourceNotFoundError } from '../../../common/resource';
import type { AuditLogEntity } from '../domain/entities';
import type { AuditLogRepository } from './ports';

/**
 * Audit use cases. Implements the cross-cutting {@link AuditRecorder} write side (append one immutable entry,
 * stamping id + timestamp) and the read side (tenant-scoped list/get for the in-app viewer). The trail is
 * append-only — there is deliberately no update or delete.
 */
export class AuditService implements AuditRecorder {
  constructor(
    private readonly repo: AuditLogRepository,
    private readonly ids: ResourceIdGenerator,
    private readonly clock: ResourceClock,
  ) {}

  /** Record an audit entry (the {@link AuditRecorder} port; called by the global interceptor). */
  async record(input: AuditRecordInput): Promise<void> {
    await this.repo.insert({
      id: this.ids.generate(),
      organizationId: input.organizationId,
      actorId: input.actorId,
      actorType: input.actorType,
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId,
      before: input.before ?? null,
      after: input.after ?? null,
      metadata: input.metadata,
      createdAt: this.clock.now(),
    });
  }

  async list(ctx: ActorContext, query: AuditLogListQuery): Promise<ListResult<AuditLogEntity>> {
    const { items, total } = await this.repo.list(ctx.organizationId, query);
    return { items, total, page: query.page, limit: query.limit };
  }

  async get(ctx: ActorContext, id: string): Promise<AuditLogEntity> {
    const entry = await this.repo.findById(ctx.organizationId, id);
    if (!entry) throw new ResourceNotFoundError('audit log', id);
    return entry;
  }
}
