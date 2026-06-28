import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import type { Model, SortOrder } from 'mongoose';
import type { TransferListQuery, TransferStatus } from '@stockflow/types';
import { MongoCounters } from '../../../../common/persistence';
import type { TransferEntity } from '../../domain/entities';
import type { TransferRepository } from '../../application/ports';
import { TRANSFER_MODEL, type TransferDoc } from './schemas';

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function toEntity(doc: TransferDoc): TransferEntity {
  const { _id, ...rest } = doc;
  return { id: _id, ...rest, lines: rest.lines ?? [] };
}

function toDoc(entity: TransferEntity): TransferDoc {
  const { id, ...rest } = entity;
  return { _id: id, ...rest };
}

interface TransferFilter {
  organizationId: string;
  status?: TransferStatus;
  transferNumber?: { $regex: string; $options: string };
}

/**
 * Mongoose adapter for transfers — same `TransferRepository` port as the in-memory store. `nextNumber` mints
 * `TR-NNNN` from the shared atomic `counters` sequence (per tenant).
 */
@Injectable()
export class MongoTransferRepository implements TransferRepository {
  constructor(
    @InjectModel(TRANSFER_MODEL) private readonly model: Model<TransferDoc>,
    private readonly counters: MongoCounters,
  ) {}

  async insert(transfer: TransferEntity): Promise<TransferEntity> {
    await this.model.create(toDoc(transfer));
    return { ...transfer };
  }

  async findById(organizationId: string, id: string): Promise<TransferEntity | null> {
    const doc = await this.model.findOne({ _id: id, organizationId }).lean<TransferDoc>().exec();
    return doc ? toEntity(doc) : null;
  }

  async update(
    organizationId: string,
    id: string,
    patch: Partial<TransferEntity>,
  ): Promise<TransferEntity | null> {
    const { id: _ignore, ...set } = patch;
    const doc = await this.model
      .findOneAndUpdate({ _id: id, organizationId }, { $set: set }, { returnDocument: 'after' })
      .lean<TransferDoc>()
      .exec();
    return doc ? toEntity(doc) : null;
  }

  async list(
    organizationId: string,
    query: TransferListQuery,
  ): Promise<{ items: TransferEntity[]; total: number }> {
    const filter: TransferFilter = { organizationId };
    if (query.status) filter.status = query.status;
    if (query.q) filter.transferNumber = { $regex: escapeRegex(query.q), $options: 'i' };

    const [total, docs] = await Promise.all([
      this.model.countDocuments(filter).exec(),
      this.model
        .find(filter)
        .sort(transferSort(query.sort))
        .skip((query.page - 1) * query.limit)
        .limit(query.limit)
        .lean<TransferDoc[]>()
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
    return this.counters.formatNext(`${organizationId}:TR`, 'TR');
  }
}

function transferSort(sort: TransferListQuery['sort']): Record<string, SortOrder> {
  const descending = sort.startsWith('-');
  const field = descending ? sort.slice(1) : sort;
  return { [field]: descending ? -1 : 1, _id: 1 };
}
