import { describe, it, expect, beforeEach } from 'vitest';
import type { NotificationListQuery } from '@stockflow/types';
import type { ActorContext } from '../../../common/auth/actor-context';
import type { NotifyInput } from '../../../common/notifications/notifier';
import { ResourceNotFoundError, type ResourceClock, type ResourceIdGenerator } from '../../../common/resource';
import { InMemoryNotificationRepository } from '../infrastructure/in-memory.repository';
import { NotificationService } from './notification.service';

const ann: ActorContext = { organizationId: 'org-1', actorId: 'user-ann' };
const bob: ActorContext = { organizationId: 'org-1', actorId: 'user-bob' };
const otherTenant: ActorContext = { organizationId: 'org-2', actorId: 'user-ann' };
const anon: ActorContext = { organizationId: 'org-1', actorId: null };
const LIST: NotificationListQuery = { page: 1, limit: 20, sort: '-createdAt', status: 'all' };

class SeqIds implements ResourceIdGenerator {
  private n = 0;
  generate(): string {
    return `id-${++this.n}`;
  }
}
class SteppingClock implements ResourceClock {
  private t = Date.parse('2026-03-01T00:00:00.000Z');
  now(): Date {
    const at = new Date(this.t);
    this.t += 1000;
    return at;
  }
}

function notif(over: Partial<NotifyInput>): NotifyInput {
  return {
    organizationId: 'org-1',
    recipientId: 'user-ann',
    type: 'purchase_order',
    title: 'Purchase order received',
    body: 'Stock was received.',
    entityType: 'purchase_order',
    entityId: 'po-1',
    link: '/purchasing/po-1',
    ...over,
  };
}

function make() {
  const repo = new InMemoryNotificationRepository();
  const service = new NotificationService(repo, new SeqIds(), new SteppingClock());
  return { repo, service };
}

describe('NotificationService.notify + read', () => {
  let ctx: ReturnType<typeof make>;
  beforeEach(() => {
    ctx = make();
  });

  it('enqueues an unread notification the recipient can read back', async () => {
    await ctx.service.notify(notif({}));
    const list = await ctx.service.list(ann, LIST);
    expect(list.total).toBe(1);
    expect(list.items[0]?.readAt).toBeNull();
    expect(list.items[0]?.link).toBe('/purchasing/po-1');
    expect(await ctx.service.unreadCount(ann)).toBe(1);
  });

  it('scopes the inbox to the recipient and tenant', async () => {
    await ctx.service.notify(notif({ recipientId: 'user-ann' }));
    await ctx.service.notify(notif({ recipientId: 'user-bob', title: 'For Bob' }));
    expect((await ctx.service.list(ann, LIST)).total).toBe(1);
    expect((await ctx.service.list(bob, LIST)).total).toBe(1);
    expect((await ctx.service.list(otherTenant, LIST)).total).toBe(0);
  });

  it('returns an empty inbox + zero count for an anonymous actor', async () => {
    await ctx.service.notify(notif({}));
    expect((await ctx.service.list(anon, LIST)).total).toBe(0);
    expect(await ctx.service.unreadCount(anon)).toBe(0);
  });
});

describe('NotificationService marking read', () => {
  let ctx: ReturnType<typeof make>;
  beforeEach(() => {
    ctx = make();
  });

  it('marks one read (idempotent) and drops the unread count', async () => {
    await ctx.service.notify(notif({}));
    const id = (await ctx.service.list(ann, LIST)).items[0]!.id;
    const read = await ctx.service.markRead(ann, id);
    expect(read.readAt).not.toBeNull();
    expect(await ctx.service.unreadCount(ann)).toBe(0);
    // idempotent: marking again keeps the same readAt and doesn't throw
    const again = await ctx.service.markRead(ann, id);
    expect(again.readAt).toEqual(read.readAt);
  });

  it("refuses to mark another recipient's notification (404)", async () => {
    await ctx.service.notify(notif({ recipientId: 'user-bob' }));
    const id = (await ctx.service.list(bob, LIST)).items[0]!.id;
    await expect(ctx.service.markRead(ann, id)).rejects.toBeInstanceOf(ResourceNotFoundError);
  });

  it('marks all read and reports how many were unread', async () => {
    await ctx.service.notify(notif({}));
    await ctx.service.notify(notif({ title: 'Another' }));
    expect(await ctx.service.markAllRead(ann)).toBe(2);
    expect(await ctx.service.unreadCount(ann)).toBe(0);
    expect(await ctx.service.markAllRead(ann)).toBe(0); // nothing left
  });

  it('filters by status and type', async () => {
    await ctx.service.notify(notif({ type: 'purchase_order' }));
    await ctx.service.notify(notif({ type: 'transfer', title: 'Transfer completed' }));
    const id = (await ctx.service.list(ann, LIST)).items[0]!.id;
    await ctx.service.markRead(ann, id);
    expect((await ctx.service.list(ann, { ...LIST, status: 'unread' })).total).toBe(1);
    expect((await ctx.service.list(ann, { ...LIST, status: 'read' })).total).toBe(1);
    expect((await ctx.service.list(ann, { ...LIST, type: 'transfer' })).total).toBe(1);
  });
});
