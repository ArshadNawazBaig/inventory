import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import type { Model, SortOrder } from 'mongoose';
import type { PurchaseOrderListQuery, PurchaseOrderStatus } from '@stockflow/types';
import { MongoCounters } from '../../../../common/persistence';
import type { PurchaseOrderEntity } from '../../domain/entities';
import type { PurchaseOrderRepository } from '../../application/ports';
import { PURCHASE_ORDER_MODEL, type PurchaseOrderDoc } from './schemas';

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function toEntity(doc: PurchaseOrderDoc): PurchaseOrderEntity {
  const { _id, ...rest } = doc;
  return { id: _id, ...rest, lines: rest.lines ?? [] };
}

function toDoc(entity: PurchaseOrderEntity): PurchaseOrderDoc {
  const { id, ...rest } = entity;
  return { _id: id, ...rest };
}

interface PurchaseOrderFilter {
  organizationId: string;
  status?: PurchaseOrderStatus;
  supplierId?: string;
  poNumber?: { $regex: string; $options: string };
}

/**
 * Mongoose adapter for purchase orders — implements the same `PurchaseOrderRepository` port as the in-memory
 * store. `nextNumber` mints `PO-NNNN` from the shared atomic `counters` sequence (per tenant).
 */
@Injectable()
export class MongoPurchaseOrderRepository implements PurchaseOrderRepository {
  constructor(
    @InjectModel(PURCHASE_ORDER_MODEL) private readonly model: Model<PurchaseOrderDoc>,
    private readonly counters: MongoCounters,
  ) {}

  async insert(order: PurchaseOrderEntity): Promise<PurchaseOrderEntity> {
    await this.model.create(toDoc(order));
    return { ...order };
  }

  async findById(organizationId: string, id: string): Promise<PurchaseOrderEntity | null> {
    const doc = await this.model.findOne({ _id: id, organizationId }).lean<PurchaseOrderDoc>().exec();
    return doc ? toEntity(doc) : null;
  }

  async update(
    organizationId: string,
    id: string,
    patch: Partial<PurchaseOrderEntity>,
  ): Promise<PurchaseOrderEntity | null> {
    const { id: _ignore, ...set } = patch;
    const doc = await this.model
      .findOneAndUpdate({ _id: id, organizationId }, { $set: set }, { returnDocument: 'after' })
      .lean<PurchaseOrderDoc>()
      .exec();
    return doc ? toEntity(doc) : null;
  }

  async list(
    organizationId: string,
    query: PurchaseOrderListQuery,
  ): Promise<{ items: PurchaseOrderEntity[]; total: number }> {
    const filter: PurchaseOrderFilter = { organizationId };
    if (query.status) filter.status = query.status;
    if (query.supplierId) filter.supplierId = query.supplierId;
    if (query.q) filter.poNumber = { $regex: escapeRegex(query.q), $options: 'i' };

    const [total, docs] = await Promise.all([
      this.model.countDocuments(filter).exec(),
      this.model
        .find(filter)
        .sort(orderSort(query.sort))
        .skip((query.page - 1) * query.limit)
        .limit(query.limit)
        .lean<PurchaseOrderDoc[]>()
        .exec(),
    ]);
    return { items: docs.map(toEntity), total };
  }

  async countByStatus(organizationId: string): Promise<Record<string, number>> {
    const rows = await this.model
      .aggregate<{ _id: string; count: number }>([
        { $match: { organizationId } },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ])
      .exec();
    const tally: Record<string, number> = {};
    for (const row of rows) tally[row._id] = row.count;
    return tally;
  }

  nextNumber(organizationId: string): Promise<string> {
    return this.counters.formatNext(`${organizationId}:PO`, 'PO');
  }
}

/** `-createdAt`/`poNumber` with a stable `_id` tiebreaker, mirroring the in-memory comparator. */
function orderSort(sort: PurchaseOrderListQuery['sort']): Record<string, SortOrder> {
  const descending = sort.startsWith('-');
  const field = descending ? sort.slice(1) : sort;
  return { [field]: descending ? -1 : 1, _id: 1 };
}
