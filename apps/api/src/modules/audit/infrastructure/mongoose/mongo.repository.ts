import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import type { Model, SortOrder } from 'mongoose';
import type { AuditLogListQuery } from '@stockflow/types';
import type { AuditLogEntity } from '../../domain/entities';
import type { AuditLogRepository } from '../../application/ports';
import { AUDIT_LOG_MODEL, type AuditLogDoc } from './schemas';

/** The `list` filter — equality terms + an inclusive `createdAt` range (mongoose accepts this shape). */
interface AuditLogFilter {
  organizationId: string;
  action?: string;
  entityType?: string;
  entityId?: string;
  actorId?: string;
  createdAt?: { $gte?: Date; $lte?: Date };
}

// ─── Mappers (entity ⇄ document; the only difference is id ⇄ _id) ────────────────
function toEntity(doc: AuditLogDoc): AuditLogEntity {
  return {
    id: doc._id,
    organizationId: doc.organizationId,
    actorId: doc.actorId,
    actorType: doc.actorType,
    action: doc.action,
    entityType: doc.entityType,
    entityId: doc.entityId,
    before: doc.before ?? null, // Mongo omits empty Mixed; restore the null invariant
    after: doc.after ?? null,
    metadata: doc.metadata,
    createdAt: doc.createdAt,
  };
}

function toDoc(entity: AuditLogEntity): AuditLogDoc {
  const { id, ...rest } = entity;
  return { _id: id, ...rest };
}

/**
 * Mongoose adapter for the audit trail — implements the same `AuditLogRepository` port as the in-memory store,
 * so the application is untouched. **Append-only**: `insert` + reads, no update/delete. Tenant-scoped on every
 * query.
 */
@Injectable()
export class MongoAuditLogRepository implements AuditLogRepository {
  constructor(@InjectModel(AUDIT_LOG_MODEL) private readonly model: Model<AuditLogDoc>) {}

  async insert(entry: AuditLogEntity): Promise<AuditLogEntity> {
    await this.model.create(toDoc(entry));
    return { ...entry };
  }

  async findById(organizationId: string, id: string): Promise<AuditLogEntity | null> {
    const doc = await this.model.findOne({ _id: id, organizationId }).lean<AuditLogDoc>().exec();
    return doc ? toEntity(doc) : null;
  }

  async list(
    organizationId: string,
    query: AuditLogListQuery,
  ): Promise<{ items: AuditLogEntity[]; total: number }> {
    const filter: AuditLogFilter = { organizationId };
    if (query.action) filter.action = query.action;
    if (query.entityType) filter.entityType = query.entityType;
    if (query.entityId) filter.entityId = query.entityId;
    if (query.actorId) filter.actorId = query.actorId;
    if (query.from || query.to) {
      filter.createdAt = {};
      if (query.from) filter.createdAt.$gte = new Date(query.from);
      if (query.to) filter.createdAt.$lte = new Date(query.to);
    }

    const [total, docs] = await Promise.all([
      this.model.countDocuments(filter).exec(),
      this.model
        .find(filter)
        .sort(sort(query.sort))
        .skip((query.page - 1) * query.limit)
        .limit(query.limit)
        .lean<AuditLogDoc[]>()
        .exec(),
    ]);
    return { items: docs.map(toEntity), total };
  }
}

/** Secondary `_id` keeps ordering stable across pages, mirroring the in-memory tiebreaker. */
function sort(value: AuditLogListQuery['sort']): Record<string, SortOrder> {
  const descending = value.startsWith('-');
  const field = descending ? value.slice(1) : value;
  return { [field]: descending ? -1 : 1, _id: 1 };
}
