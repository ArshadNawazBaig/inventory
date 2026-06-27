import { Injectable } from '@nestjs/common';
import type { NotificationListQuery } from '@stockflow/types';
import type { NotificationEntity } from '../domain/entities';
import type { NotificationRepository } from '../application/ports';

/**
 * In-memory notification store — runnable, fully-testable persistence until the database module lands. Scoped to
 * (tenant × recipient); supports status + type filters. The Mongoose adapter implements the same port without
 * touching the application.
 */
@Injectable()
export class InMemoryNotificationRepository implements NotificationRepository {
  private readonly store = new Map<string, NotificationEntity>();

  insert(notification: NotificationEntity): Promise<NotificationEntity> {
    this.store.set(notification.id, this.clone(notification));
    return Promise.resolve(this.clone(notification));
  }

  findById(organizationId: string, id: string): Promise<NotificationEntity | null> {
    const found = this.store.get(id);
    if (!found || found.organizationId !== organizationId) return Promise.resolve(null);
    return Promise.resolve(this.clone(found));
  }

  list(
    organizationId: string,
    recipientId: string,
    query: NotificationListQuery,
  ): Promise<{ items: NotificationEntity[]; total: number }> {
    let items = this.mine(organizationId, recipientId);
    if (query.status === 'unread') items = items.filter((n) => n.readAt === null);
    if (query.status === 'read') items = items.filter((n) => n.readAt !== null);
    if (query.type) items = items.filter((n) => n.type === query.type);
    items.sort(this.comparator(query.sort));

    const total = items.length;
    const start = (query.page - 1) * query.limit;
    const page = items.slice(start, start + query.limit).map((n) => this.clone(n));
    return Promise.resolve({ items: page, total });
  }

  countUnread(organizationId: string, recipientId: string): Promise<number> {
    return Promise.resolve(this.mine(organizationId, recipientId).filter((n) => n.readAt === null).length);
  }

  update(
    organizationId: string,
    id: string,
    patch: Partial<NotificationEntity>,
  ): Promise<NotificationEntity | null> {
    const found = this.store.get(id);
    if (!found || found.organizationId !== organizationId) return Promise.resolve(null);
    const next = { ...found, ...patch };
    this.store.set(id, next);
    return Promise.resolve(this.clone(next));
  }

  markAllRead(organizationId: string, recipientId: string, readAt: Date): Promise<number> {
    let updated = 0;
    for (const n of this.mine(organizationId, recipientId)) {
      if (n.readAt === null) {
        this.store.set(n.id, { ...n, readAt });
        updated += 1;
      }
    }
    return Promise.resolve(updated);
  }

  private mine(organizationId: string, recipientId: string): NotificationEntity[] {
    return [...this.store.values()].filter(
      (n) => n.organizationId === organizationId && n.recipientId === recipientId,
    );
  }

  private comparator(
    sort: NotificationListQuery['sort'],
  ): (a: NotificationEntity, b: NotificationEntity) => number {
    const direction = sort.startsWith('-') ? -1 : 1;
    return (a, b) => {
      const left = a.createdAt.getTime();
      const right = b.createdAt.getTime();
      if (left < right) return -1 * direction;
      if (left > right) return 1 * direction;
      return a.id < b.id ? -1 : 1;
    };
  }

  private clone(n: NotificationEntity): NotificationEntity {
    return { ...n };
  }
}
