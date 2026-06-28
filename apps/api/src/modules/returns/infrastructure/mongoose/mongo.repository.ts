import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import type { Model, SortOrder } from 'mongoose';
import type { ReturnKind, ReturnListQuery, ReturnStatus } from '@stockflow/types';
import { MongoCounters } from '../../../../common/persistence';
import type { ReturnEntity } from '../../domain/entities';
import type { ReturnRepository } from '../../application/ports';
import { RETURN_MODEL, type ReturnDoc } from './schemas';

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function toEntity(doc: ReturnDoc): ReturnEntity {
  const { _id, ...rest } = doc;
  return { id: _id, ...rest, lines: rest.lines ?? [] };
}

function toDoc(entity: ReturnEntity): ReturnDoc {
  const { id, ...rest } = entity;
  return { _id: id, ...rest };
}

interface ReturnFilter {
  organizationId: string;
  kind?: ReturnKind;
  status?: ReturnStatus;
  returnNumber?: { $regex: string; $options: string };
}

/**
 * Mongoose adapter for returns — same `ReturnRepository` port as the in-memory store. `nextNumber` mints
 * `RET-NNNN` from the shared atomic `counters` sequence (per tenant).
 */
@Injectable()
export class MongoReturnRepository implements ReturnRepository {
  constructor(
    @InjectModel(RETURN_MODEL) private readonly model: Model<ReturnDoc>,
    private readonly counters: MongoCounters,
  ) {}

  async insert(ret: ReturnEntity): Promise<ReturnEntity> {
    await this.model.create(toDoc(ret));
    return { ...ret };
  }

  async findById(organizationId: string, id: string): Promise<ReturnEntity | null> {
    const doc = await this.model.findOne({ _id: id, organizationId }).lean<ReturnDoc>().exec();
    return doc ? toEntity(doc) : null;
  }

  async update(
    organizationId: string,
    id: string,
    patch: Partial<ReturnEntity>,
  ): Promise<ReturnEntity | null> {
    const { id: _ignore, ...set } = patch;
    const doc = await this.model
      .findOneAndUpdate({ _id: id, organizationId }, { $set: set }, { returnDocument: 'after' })
      .lean<ReturnDoc>()
      .exec();
    return doc ? toEntity(doc) : null;
  }

  async list(
    organizationId: string,
    query: ReturnListQuery,
  ): Promise<{ items: ReturnEntity[]; total: number }> {
    const filter: ReturnFilter = { organizationId };
    if (query.kind) filter.kind = query.kind;
    if (query.status) filter.status = query.status;
    if (query.q) filter.returnNumber = { $regex: escapeRegex(query.q), $options: 'i' };

    const [total, docs] = await Promise.all([
      this.model.countDocuments(filter).exec(),
      this.model
        .find(filter)
        .sort(returnSort(query.sort))
        .skip((query.page - 1) * query.limit)
        .limit(query.limit)
        .lean<ReturnDoc[]>()
        .exec(),
    ]);
    return { items: docs.map(toEntity), total };
  }

  nextNumber(organizationId: string): Promise<string> {
    return this.counters.formatNext(`${organizationId}:RET`, 'RET');
  }
}

function returnSort(sort: ReturnListQuery['sort']): Record<string, SortOrder> {
  const descending = sort.startsWith('-');
  const field = descending ? sort.slice(1) : sort;
  return { [field]: descending ? -1 : 1, _id: 1 };
}
