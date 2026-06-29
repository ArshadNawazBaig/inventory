import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import type { Model, SortOrder } from 'mongoose';
import type { SaleListQuery } from '@stockflow/types';
import { MongoCounters } from '../../../../common/persistence';
import type { PosSaleEntity } from '../../domain/entities';
import type { PosSaleRepository } from '../../application/ports';
import { POS_SALE_MODEL, type PosSaleDoc } from './schemas';

/** The POS sale `list` filter — tenant + optional location. */
interface PosSaleFilter {
  organizationId: string;
  locationId?: string;
}

function toEntity(doc: PosSaleDoc): PosSaleEntity {
  return {
    id: doc._id,
    organizationId: doc.organizationId,
    receiptNumber: doc.receiptNumber,
    locationId: doc.locationId,
    customerId: doc.customerId,
    currency: doc.currency,
    lines: doc.lines.map((line) => ({ ...line })),
    subtotalMinor: doc.subtotalMinor,
    totalMinor: doc.totalMinor,
    paymentMethod: doc.paymentMethod,
    amountTenderedMinor: doc.amountTenderedMinor,
    changeMinor: doc.changeMinor,
    soldByUserId: doc.soldByUserId,
    note: doc.note,
    createdAt: doc.createdAt,
  };
}

/**
 * Mongoose adapter for POS sales — same `PosSaleRepository` port as the in-memory store. `nextNumber` mints
 * `RC-NNNN` from the shared atomic `counters` sequence (per tenant), race-free across instances.
 */
@Injectable()
export class MongoPosSaleRepository implements PosSaleRepository {
  constructor(
    @InjectModel(POS_SALE_MODEL) private readonly model: Model<PosSaleDoc>,
    private readonly counters: MongoCounters,
  ) {}

  async insert(sale: PosSaleEntity): Promise<PosSaleEntity> {
    const { id, ...rest } = sale;
    await this.model.create({ _id: id, ...rest });
    return { ...sale, lines: sale.lines.map((line) => ({ ...line })) };
  }

  async findById(organizationId: string, id: string): Promise<PosSaleEntity | null> {
    const doc = await this.model.findOne({ _id: id, organizationId }).lean<PosSaleDoc>().exec();
    return doc ? toEntity(doc) : null;
  }

  async list(
    organizationId: string,
    query: SaleListQuery,
  ): Promise<{ items: PosSaleEntity[]; total: number }> {
    const filter: PosSaleFilter = { organizationId };
    if (query.locationId) filter.locationId = query.locationId;
    const direction: SortOrder = query.sort.startsWith('-') ? -1 : 1;

    const [total, docs] = await Promise.all([
      this.model.countDocuments(filter).exec(),
      this.model
        .find(filter)
        .sort({ createdAt: direction, _id: direction })
        .skip((query.page - 1) * query.limit)
        .limit(query.limit)
        .lean<PosSaleDoc[]>()
        .exec(),
    ]);
    return { items: docs.map(toEntity), total };
  }

  nextNumber(organizationId: string): Promise<string> {
    return this.counters.formatNext(`${organizationId}:RC`, 'RC');
  }
}
