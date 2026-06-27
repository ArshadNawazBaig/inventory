import type { NotificationListQuery } from '@stockflow/types';
import type { ActorContext } from '../../../common/auth/actor-context';
import type { Notifier, NotifyInput } from '../../../common/notifications/notifier';
import type { ListResult, ResourceClock, ResourceIdGenerator } from '../../../common/resource';
import { ResourceNotFoundError } from '../../../common/resource';
import type { NotificationEntity } from '../domain/entities';
import type { NotificationRepository } from './ports';

/**
 * Notification use cases. Implements the cross-cutting {@link Notifier} write side (enqueue one inbox row) and
 * the recipient-facing read/manage side (list / unread-count / mark-read / mark-all-read). Every read+write is
 * scoped to the acting user — a notification belongs to exactly one recipient in one tenant.
 */
export class NotificationService implements Notifier {
  constructor(
    private readonly repo: NotificationRepository,
    private readonly ids: ResourceIdGenerator,
    private readonly clock: ResourceClock,
  ) {}

  /** Enqueue a notification for one recipient (the {@link Notifier} port; called by the global interceptor). */
  async notify(input: NotifyInput): Promise<void> {
    await this.repo.insert({
      id: this.ids.generate(),
      organizationId: input.organizationId,
      recipientId: input.recipientId,
      type: input.type,
      title: input.title,
      body: input.body,
      entityType: input.entityType ?? null,
      entityId: input.entityId ?? null,
      link: input.link ?? null,
      readAt: null,
      createdAt: this.clock.now(),
    });
  }

  async list(ctx: ActorContext, query: NotificationListQuery): Promise<ListResult<NotificationEntity>> {
    const recipientId = ctx.actorId;
    if (recipientId === null) return { items: [], total: 0, page: query.page, limit: query.limit };
    const { items, total } = await this.repo.list(ctx.organizationId, recipientId, query);
    return { items, total, page: query.page, limit: query.limit };
  }

  async unreadCount(ctx: ActorContext): Promise<number> {
    if (ctx.actorId === null) return 0;
    return this.repo.countUnread(ctx.organizationId, ctx.actorId);
  }

  /** Mark one of the recipient's notifications read (idempotent). Cross-recipient/tenant → 404. */
  async markRead(ctx: ActorContext, id: string): Promise<NotificationEntity> {
    const existing = await this.requireOwned(ctx, id);
    if (existing.readAt !== null) return existing;
    const updated = await this.repo.update(ctx.organizationId, id, { readAt: this.clock.now() });
    if (!updated) throw new ResourceNotFoundError('notification', id);
    return updated;
  }

  /** Mark the recipient's entire inbox read; returns how many were unread. */
  async markAllRead(ctx: ActorContext): Promise<number> {
    if (ctx.actorId === null) return 0;
    return this.repo.markAllRead(ctx.organizationId, ctx.actorId, this.clock.now());
  }

  private async requireOwned(ctx: ActorContext, id: string): Promise<NotificationEntity> {
    const found = ctx.actorId === null ? null : await this.repo.findById(ctx.organizationId, id);
    if (!found || found.recipientId !== ctx.actorId) throw new ResourceNotFoundError('notification', id);
    return found;
  }
}
