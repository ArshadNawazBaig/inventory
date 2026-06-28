import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import type { Model, SortOrder } from 'mongoose';
import type { SalesOrderListQuery, SalesOrderStatus } from '@stockflow/types';
import { MongoCounters } from '../../../../common/persistence';
import type { SalesOrderEntity } from '../../domain/entities';
import type { SalesOrderRepository } from '../../application/ports';
import { SALES_ORDER_MODEL, type SalesOrderDoc } from './schemas';

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function toEntity(doc: SalesOrderDoc): SalesOrderEntity {
  const { _id, ...rest } = doc;
  return { id: _id, ...rest, lines: rest.lines ?? [] };
}

function toDoc(entity: SalesOrderEntity): SalesOrderDoc {
  const { id, ...rest } = entity;
  return { _id: id, ...rest };
}

interface SalesOrderFilter {
  organizationId: string;
  status?: SalesOrderStatus;
  customerId?: string;
  soNumber?: { $regex: string; $options: string };
}

/**
 * Mongoose adapter for sales orders — same `SalesOrderRepository` port as the in-memory store. `nextNumber`
 * mints `SO-NNNN` from the shared atomic `counters` sequence (per tenant).
 */
@Injectable()
export class MongoSalesOrderRepository implements SalesOrderRepository {
  constructor(
    @InjectModel(SALES_ORDER_MODEL) private readonly model: Model<SalesOrderDoc>,
    private readonly counters: MongoCounters,
  ) {}

  async insert(order: SalesOrderEntity): Promise<SalesOrderEntity> {
    await this.model.create(toDoc(order));
    return { ...order };
  }

  async findById(organizationId: string, id: string): Promise<SalesOrderEntity | null> {
    const doc = await this.model.findOne({ _id: id, organizationId }).lean<SalesOrderDoc>().exec();
    return doc ? toEntity(doc) : null;
  }

  async update(
    organizationId: string,
    id: string,
    patch: Partial<SalesOrderEntity>,
  ): Promise<SalesOrderEntity | null> {
    const { id: _ignore, ...set } = patch;
    const doc = await this.model
      .findOneAndUpdate({ _id: id, organizationId }, { $set: set }, { returnDocument: 'after' })
      .lean<SalesOrderDoc>()
      .exec();
    return doc ? toEntity(doc) : null;
  }

  async list(
    organizationId: string,
    query: SalesOrderListQuery,
  ): Promise<{ items: SalesOrderEntity[]; total: number }> {
    const filter: SalesOrderFilter = { organizationId };
    if (query.status) filter.status = query.status;
    if (query.customerId) filter.customerId = query.customerId;
    if (query.q) filter.soNumber = { $regex: escapeRegex(query.q), $options: 'i' };

    const [total, docs] = await Promise.all([
      this.model.countDocuments(filter).exec(),
      this.model
        .find(filter)
        .sort(orderSort(query.sort))
        .skip((query.page - 1) * query.limit)
        .limit(query.limit)
        .lean<SalesOrderDoc[]>()
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
    return this.counters.formatNext(`${organizationId}:SO`, 'SO');
  }
}

function orderSort(sort: SalesOrderListQuery['sort']): Record<string, SortOrder> {
  const descending = sort.startsWith('-');
  const field = descending ? sort.slice(1) : sort;
  return { [field]: descending ? -1 : 1, _id: 1 };
}
