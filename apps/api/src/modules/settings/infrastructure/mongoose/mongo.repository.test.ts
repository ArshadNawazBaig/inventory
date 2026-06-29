import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import mongoose, { type Model } from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import type { OrganizationSettingsEntity } from '../../domain/entities';
import { MongoOrganizationSettingsRepository } from './mongo.repository';
import {
  ORGANIZATION_SETTINGS_MODEL,
  OrganizationSettingsSchema,
  type OrganizationSettingsDoc,
} from './schemas';

/**
 * Parity test for the Mongoose settings adapter against a real (ephemeral) MongoDB — proves the singleton
 * upsert (one document per tenant, keyed by `_id` = organizationId) roundtrips and is tenant-isolated, with the
 * same semantics as the in-memory adapter.
 */

const ORG = 'org-1';
let mem: MongoMemoryServer;
let model: Model<OrganizationSettingsDoc>;
let repo: MongoOrganizationSettingsRepository;

function settings(over: Partial<OrganizationSettingsEntity> = {}): OrganizationSettingsEntity {
  return {
    organizationId: ORG,
    defaultCurrency: 'USD',
    timezone: 'UTC',
    allowNegativeStock: false,
    lowStockAlertsEnabled: true,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedBy: 'user-1',
    ...over,
  };
}

beforeAll(async () => {
  mem = await MongoMemoryServer.create();
  await mongoose.connect(mem.getUri());
  model = mongoose.model<OrganizationSettingsDoc>(ORGANIZATION_SETTINGS_MODEL, OrganizationSettingsSchema);
  repo = new MongoOrganizationSettingsRepository(model);
}, 60_000);

afterEach(async () => {
  await model.deleteMany({});
});

afterAll(async () => {
  await mongoose.disconnect();
  await mem.stop();
});

describe('MongoOrganizationSettingsRepository', () => {
  it('returns null before the tenant has saved', async () => {
    expect(await repo.findByOrg(ORG)).toBeNull();
  });

  it('upserts and reads back the singleton (full roundtrip)', async () => {
    const s = settings({ defaultCurrency: 'EUR', allowNegativeStock: true });
    const saved = await repo.upsert(s);
    expect(saved).toEqual(s);
    expect(await repo.findByOrg(ORG)).toEqual(s);
  });

  it('upsert overwrites the same document (no duplicate per tenant)', async () => {
    await repo.upsert(settings({ timezone: 'UTC' }));
    await repo.upsert(settings({ timezone: 'America/New_York', updatedBy: 'user-2' }));
    expect(await model.countDocuments({})).toBe(1);
    const current = await repo.findByOrg(ORG);
    expect(current?.timezone).toBe('America/New_York');
    expect(current?.updatedBy).toBe('user-2');
  });

  it('isolates tenants', async () => {
    await repo.upsert(settings({ organizationId: ORG, defaultCurrency: 'USD' }));
    await repo.upsert(settings({ organizationId: 'org-2', defaultCurrency: 'GBP' }));
    expect((await repo.findByOrg(ORG))?.defaultCurrency).toBe('USD');
    expect((await repo.findByOrg('org-2'))?.defaultCurrency).toBe('GBP');
  });
});
