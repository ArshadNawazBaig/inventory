import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import mongoose, { type Model } from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import type { SubscriptionEntity } from '../../domain/entities';
import { MongoSubscriptionRepository } from './mongo.repository';
import { SUBSCRIPTION_MODEL, SubscriptionSchema, type SubscriptionDoc } from './schemas';

/**
 * Parity test for the Mongoose subscription adapter against a real (ephemeral) MongoDB — proves the singleton
 * upsert (one document per tenant, keyed by `_id` = organizationId) roundtrips and is tenant-isolated, with the
 * same semantics as the in-memory adapter.
 */

const ORG = 'org-1';
let mem: MongoMemoryServer;
let model: Model<SubscriptionDoc>;
let repo: MongoSubscriptionRepository;

function subscription(over: Partial<SubscriptionEntity> = {}): SubscriptionEntity {
  return {
    organizationId: ORG,
    planId: 'starter',
    status: 'active',
    currentPeriodStart: new Date('2026-01-01T00:00:00.000Z'),
    currentPeriodEnd: new Date('2026-02-01T00:00:00.000Z'),
    cancelAtPeriodEnd: false,
    externalId: null,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedBy: 'user-1',
    ...over,
  };
}

beforeAll(async () => {
  mem = await MongoMemoryServer.create();
  await mongoose.connect(mem.getUri());
  model = mongoose.model<SubscriptionDoc>(SUBSCRIPTION_MODEL, SubscriptionSchema);
  repo = new MongoSubscriptionRepository(model);
}, 60_000);

afterEach(async () => {
  await model.deleteMany({});
});

afterAll(async () => {
  await mongoose.disconnect();
  await mem.stop();
});

describe('MongoSubscriptionRepository', () => {
  it('returns null before the tenant has subscribed', async () => {
    expect(await repo.findByOrg(ORG)).toBeNull();
  });

  it('upserts and reads back the singleton (full roundtrip)', async () => {
    const s = subscription({ planId: 'growth', externalId: 'sub_123' });
    const saved = await repo.upsert(s);
    expect(saved).toEqual(s);
    expect(await repo.findByOrg(ORG)).toEqual(s);
  });

  it('upsert overwrites the same document (no duplicate per tenant)', async () => {
    await repo.upsert(subscription({ planId: 'starter' }));
    await repo.upsert(subscription({ planId: 'growth', cancelAtPeriodEnd: true, updatedBy: 'user-2' }));
    expect(await model.countDocuments({})).toBe(1);
    const current = await repo.findByOrg(ORG);
    expect(current?.planId).toBe('growth');
    expect(current?.cancelAtPeriodEnd).toBe(true);
    expect(current?.updatedBy).toBe('user-2');
  });

  it('isolates tenants', async () => {
    await repo.upsert(subscription({ organizationId: ORG, planId: 'starter' }));
    await repo.upsert(subscription({ organizationId: 'org-2', planId: 'enterprise' }));
    expect((await repo.findByOrg(ORG))?.planId).toBe('starter');
    expect((await repo.findByOrg('org-2'))?.planId).toBe('enterprise');
  });
});
