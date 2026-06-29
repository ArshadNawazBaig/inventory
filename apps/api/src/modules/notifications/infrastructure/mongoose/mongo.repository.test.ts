import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import mongoose, { type Model } from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import type { NotificationEntity } from '../../domain/entities';
import { MongoNotificationRepository } from './mongo.repository';
import { NOTIFICATION_MODEL, NotificationSchema, type NotificationDoc } from './schemas';

/**
 * Parity test for the Mongoose notification adapter against a real (ephemeral) MongoDB — proves it satisfies
 * the `NotificationRepository` port with the same semantics as the in-memory adapter ((tenant × recipient)
 * scoping, status/type filters, unread count, single + bulk read updates, sort, pagination).
 */

const ORG = 'org-1';
const ME = 'user-1';
const OTHER = 'user-2';
let mem: MongoMemoryServer;
let model: Model<NotificationDoc>;
let repo: MongoNotificationRepository;

let counter = 0;
const oid = (): string => String(++counter).padStart(24, '0');

function notification(over: Partial<NotificationEntity> = {}): NotificationEntity {
  return {
    id: oid(),
    organizationId: ORG,
    recipientId: ME,
    type: 'system',
    title: 'Title',
    body: 'Body',
    entityType: null,
    entityId: null,
    link: null,
    readAt: null,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    ...over,
  };
}

beforeAll(async () => {
  mem = await MongoMemoryServer.create();
  await mongoose.connect(mem.getUri());
  model = mongoose.model<NotificationDoc>(NOTIFICATION_MODEL, NotificationSchema);
  repo = new MongoNotificationRepository(model);
}, 60_000);

afterEach(async () => {
  await model.deleteMany({});
});

afterAll(async () => {
  await mongoose.disconnect();
  await mem.stop();
});

describe('MongoNotificationRepository', () => {
  it('persists and reads back a notification (full roundtrip), tenant-scoped', async () => {
    const n = notification({ type: 'purchase_order', entityType: 'purchase_order', entityId: 'po-1', link: '/p/1' });
    await repo.insert(n);
    expect(await repo.findById(ORG, n.id)).toEqual(n);
    expect(await repo.findById('org-2', n.id)).toBeNull();
  });

  it('lists only the recipient inbox with status + type filters', async () => {
    await repo.insert(notification({ type: 'system', createdAt: new Date('2026-01-03T00:00:00.000Z') }));
    await repo.insert(notification({ type: 'inventory', readAt: new Date('2026-01-04T00:00:00.000Z'), createdAt: new Date('2026-01-02T00:00:00.000Z') }));
    await repo.insert(notification({ recipientId: OTHER })); // someone else's inbox, excluded

    const all = await repo.list(ORG, ME, { page: 1, limit: 10, sort: '-createdAt', status: 'all' });
    expect(all.total).toBe(2);

    const unread = await repo.list(ORG, ME, { page: 1, limit: 10, sort: '-createdAt', status: 'unread' });
    expect(unread.items.map((n) => n.type)).toEqual(['system']);

    const read = await repo.list(ORG, ME, { page: 1, limit: 10, sort: '-createdAt', status: 'read' });
    expect(read.items.map((n) => n.type)).toEqual(['inventory']);

    const byType = await repo.list(ORG, ME, { page: 1, limit: 10, sort: '-createdAt', status: 'all', type: 'inventory' });
    expect(byType.total).toBe(1);
  });

  it('counts unread per recipient', async () => {
    await repo.insert(notification());
    await repo.insert(notification());
    await repo.insert(notification({ readAt: new Date('2026-01-02T00:00:00.000Z') }));
    await repo.insert(notification({ recipientId: OTHER }));
    expect(await repo.countUnread(ORG, ME)).toBe(2);
    expect(await repo.countUnread(ORG, OTHER)).toBe(1);
  });

  it('updates a single notification within the tenant and returns null for a miss', async () => {
    const n = notification();
    await repo.insert(n);
    const readAt = new Date('2026-02-01T00:00:00.000Z');
    const updated = await repo.update(ORG, n.id, { readAt });
    expect(updated).toMatchObject({ id: n.id, readAt });
    expect(await repo.update('org-2', n.id, { readAt })).toBeNull();
  });

  it('marks all unread read for the recipient and returns the count', async () => {
    await repo.insert(notification());
    await repo.insert(notification());
    await repo.insert(notification({ readAt: new Date('2026-01-02T00:00:00.000Z') })); // already read
    await repo.insert(notification({ recipientId: OTHER })); // other recipient, untouched

    const readAt = new Date('2026-02-01T00:00:00.000Z');
    expect(await repo.markAllRead(ORG, ME, readAt)).toBe(2);
    expect(await repo.countUnread(ORG, ME)).toBe(0);
    expect(await repo.countUnread(ORG, OTHER)).toBe(1);
  });
});
