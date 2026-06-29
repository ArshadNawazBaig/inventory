import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import type { Model, SortOrder } from 'mongoose';
import type { NotificationListQuery, NotificationType } from '@stockflow/types';
import type { NotificationEntity } from '../../domain/entities';
import type { NotificationRepository } from '../../application/ports';
import { NOTIFICATION_MODEL, type NotificationDoc } from './schemas';

/** The inbox `list` filter — always (tenant × recipient), plus optional read-state and type terms. */
interface NotificationListFilter {
  organizationId: string;
  recipientId: string;
  readAt?: null | { $ne: null };
  type?: NotificationType;
}

// ─── Mappers (entity ⇄ document; the only difference is id ⇄ _id) ────────────────
function toEntity(doc: NotificationDoc): NotificationEntity {
  return {
    id: doc._id,
    organizationId: doc.organizationId,
    recipientId: doc.recipientId,
    type: doc.type,
    title: doc.title,
    body: doc.body,
    entityType: doc.entityType,
    entityId: doc.entityId,
    link: doc.link,
    readAt: doc.readAt,
    createdAt: doc.createdAt,
  };
}

function toDoc(entity: NotificationEntity): NotificationDoc {
  const { id, ...rest } = entity;
  return { _id: id, ...rest };
}

/**
 * Mongoose adapter for notifications — implements the same `NotificationRepository` port as the in-memory store,
 * so the application is untouched. Every query is scoped to (tenant × recipient): a user only sees their own
 * inbox.
 */
@Injectable()
export class MongoNotificationRepository implements NotificationRepository {
  constructor(@InjectModel(NOTIFICATION_MODEL) private readonly model: Model<NotificationDoc>) {}

  async insert(notification: NotificationEntity): Promise<NotificationEntity> {
    await this.model.create(toDoc(notification));
    return { ...notification };
  }

  async findById(organizationId: string, id: string): Promise<NotificationEntity | null> {
    const doc = await this.model.findOne({ _id: id, organizationId }).lean<NotificationDoc>().exec();
    return doc ? toEntity(doc) : null;
  }

  async list(
    organizationId: string,
    recipientId: string,
    query: NotificationListQuery,
  ): Promise<{ items: NotificationEntity[]; total: number }> {
    const filter: NotificationListFilter = { organizationId, recipientId };
    if (query.status === 'unread') filter.readAt = null;
    if (query.status === 'read') filter.readAt = { $ne: null };
    if (query.type) filter.type = query.type;

    const [total, docs] = await Promise.all([
      this.model.countDocuments(filter).exec(),
      this.model
        .find(filter)
        .sort(sort(query.sort))
        .skip((query.page - 1) * query.limit)
        .limit(query.limit)
        .lean<NotificationDoc[]>()
        .exec(),
    ]);
    return { items: docs.map(toEntity), total };
  }

  countUnread(organizationId: string, recipientId: string): Promise<number> {
    return this.model.countDocuments({ organizationId, recipientId, readAt: null }).exec();
  }

  async update(
    organizationId: string,
    id: string,
    patch: Partial<NotificationEntity>,
  ): Promise<NotificationEntity | null> {
    const { id: _ignore, ...set } = patch;
    const doc = await this.model
      .findOneAndUpdate({ _id: id, organizationId }, { $set: set }, { returnDocument: 'after' })
      .lean<NotificationDoc>()
      .exec();
    return doc ? toEntity(doc) : null;
  }

  async markAllRead(organizationId: string, recipientId: string, readAt: Date): Promise<number> {
    const result = await this.model
      .updateMany({ organizationId, recipientId, readAt: null }, { $set: { readAt } })
      .exec();
    return result.modifiedCount;
  }
}

/** Secondary `_id` keeps ordering stable across pages, mirroring the in-memory tiebreaker. */
function sort(value: NotificationListQuery['sort']): Record<string, SortOrder> {
  const descending = value.startsWith('-');
  const field = descending ? value.slice(1) : value;
  return { [field]: descending ? -1 : 1, _id: 1 };
}
