import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import type { Model } from 'mongoose';
import type { SubscriptionEntity } from '../../domain/entities';
import type { SubscriptionRepository } from '../../application/ports';
import { SUBSCRIPTION_MODEL, type SubscriptionDoc } from './schemas';

// ─── Mappers (entity ⇄ document; the tenant identity lives in `_id`) ──────────────
function toEntity(doc: SubscriptionDoc): SubscriptionEntity {
  return {
    organizationId: doc._id,
    planId: doc.planId,
    status: doc.status,
    currentPeriodStart: doc.currentPeriodStart,
    currentPeriodEnd: doc.currentPeriodEnd,
    cancelAtPeriodEnd: doc.cancelAtPeriodEnd,
    externalId: doc.externalId,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
    updatedBy: doc.updatedBy,
  };
}

/** The mutable fields (everything but the `_id`/`organizationId` identity) — the `$set` payload on upsert. */
function toSet(entity: SubscriptionEntity): Omit<SubscriptionDoc, '_id'> {
  const { organizationId: _ignore, ...rest } = entity;
  return rest;
}

/**
 * Mongoose adapter for the subscription singleton — implements the same `SubscriptionRepository` port as the
 * in-memory store, so the application is untouched. One document per tenant, upserted by `_id`
 * (= organizationId); kept in sync with Stripe via webhooks in production.
 */
@Injectable()
export class MongoSubscriptionRepository implements SubscriptionRepository {
  constructor(@InjectModel(SUBSCRIPTION_MODEL) private readonly model: Model<SubscriptionDoc>) {}

  async findByOrg(organizationId: string): Promise<SubscriptionEntity | null> {
    const doc = await this.model.findById(organizationId).lean<SubscriptionDoc>().exec();
    return doc ? toEntity(doc) : null;
  }

  async upsert(subscription: SubscriptionEntity): Promise<SubscriptionEntity> {
    const doc = await this.model
      .findByIdAndUpdate(
        subscription.organizationId,
        { $set: toSet(subscription) },
        { upsert: true, returnDocument: 'after' },
      )
      .lean<SubscriptionDoc>()
      .exec();
    return doc ? toEntity(doc) : { ...subscription };
  }
}
