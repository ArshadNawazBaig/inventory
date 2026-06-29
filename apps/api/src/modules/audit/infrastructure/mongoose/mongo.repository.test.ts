import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import mongoose, { type Model } from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import type { AuditLogEntity } from '../../domain/entities';
import { MongoAuditLogRepository } from './mongo.repository';
import { AUDIT_LOG_MODEL, AuditLogSchema, type AuditLogDoc } from './schemas';

/**
 * Parity test for the Mongoose audit adapter against a real (ephemeral) MongoDB — proves it satisfies the
 * `AuditLogRepository` port with the same semantics as the in-memory adapter (append-only, tenant scoping,
 * filters, date range, sort, pagination, Mixed diff roundtrip).
 */

const ORG = 'org-1';
let mem: MongoMemoryServer;
let model: Model<AuditLogDoc>;
let repo: MongoAuditLogRepository;

let counter = 0;
const oid = (): string => String(++counter).padStart(24, '0');

function entry(over: Partial<AuditLogEntity> = {}): AuditLogEntity {
  return {
    id: oid(),
    organizationId: ORG,
    actorId: 'user-1',
    actorType: 'user',
    action: 'product.created',
    entityType: 'product',
    entityId: oid(),
    before: null,
    after: null,
    metadata: { ip: null, userAgent: null, requestId: null, method: null, path: null, statusCode: null },
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    ...over,
  };
}

beforeAll(async () => {
  mem = await MongoMemoryServer.create();
  await mongoose.connect(mem.getUri());
  model = mongoose.model<AuditLogDoc>(AUDIT_LOG_MODEL, AuditLogSchema);
  repo = new MongoAuditLogRepository(model);
}, 60_000);

afterEach(async () => {
  await model.deleteMany({});
});

afterAll(async () => {
  await mongoose.disconnect();
  await mem.stop();
});

describe('MongoAuditLogRepository', () => {
  it('persists and reads back an entry, incl. the Mixed diff + metadata (full roundtrip)', async () => {
    const e = entry({
      before: { name: 'Old' },
      after: { name: 'New' },
      metadata: { ip: '127.0.0.1', userAgent: 'jest', requestId: 'req-1', method: 'POST', path: '/x', statusCode: 201 },
    });
    await repo.insert(e);
    expect(await repo.findById(ORG, e.id)).toEqual(e);
  });

  it('scopes findById by tenant', async () => {
    const e = entry();
    await repo.insert(e);
    expect(await repo.findById('org-2', e.id)).toBeNull();
  });

  it('lists with action/entity/actor filters, sort and pagination, tenant-scoped', async () => {
    await repo.insert(entry({ action: 'product.created', entityType: 'product', createdAt: new Date('2026-01-02T00:00:00.000Z') }));
    await repo.insert(entry({ action: 'product.updated', entityType: 'product', createdAt: new Date('2026-01-03T00:00:00.000Z') }));
    await repo.insert(entry({ action: 'order.created', entityType: 'order', actorId: 'user-2', createdAt: new Date('2026-01-01T00:00:00.000Z') }));
    await repo.insert(entry({ organizationId: 'org-2' })); // other tenant, excluded

    const all = await repo.list(ORG, { page: 1, limit: 10, sort: '-createdAt' });
    expect(all.total).toBe(3);
    expect(all.items.map((e) => e.action)).toEqual(['product.updated', 'product.created', 'order.created']);

    const products = await repo.list(ORG, { page: 1, limit: 10, sort: 'createdAt', entityType: 'product' });
    expect(products.items.map((e) => e.action)).toEqual(['product.created', 'product.updated']);

    const byActor = await repo.list(ORG, { page: 1, limit: 10, sort: '-createdAt', actorId: 'user-2' });
    expect(byActor.total).toBe(1);
    expect(byActor.items[0]?.action).toBe('order.created');

    const page2 = await repo.list(ORG, { page: 2, limit: 1, sort: 'createdAt' });
    expect(page2.items.map((e) => e.action)).toEqual(['product.created']);
    expect(page2.total).toBe(3);
  });

  it('filters by inclusive createdAt range', async () => {
    await repo.insert(entry({ action: 'a', createdAt: new Date('2026-01-01T00:00:00.000Z') }));
    await repo.insert(entry({ action: 'b', createdAt: new Date('2026-01-05T00:00:00.000Z') }));
    await repo.insert(entry({ action: 'c', createdAt: new Date('2026-01-10T00:00:00.000Z') }));

    const window = await repo.list(ORG, {
      page: 1,
      limit: 10,
      sort: 'createdAt',
      from: '2026-01-03',
      to: '2026-01-06',
    });
    expect(window.items.map((e) => e.action)).toEqual(['b']);
  });
});
