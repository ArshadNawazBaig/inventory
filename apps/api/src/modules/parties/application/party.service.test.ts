import { describe, it, expect, beforeEach } from 'vitest';
import type { LookupListQuery } from '@stockflow/types';
import type { ActorContext } from '../../../common/auth/actor-context';
import {
  DuplicateResourceError,
  ResourceNotFoundError,
  type ResourceClock,
  type ResourceEvent,
  type ResourceEventPublisher,
  type ResourceIdGenerator,
} from '../../../common/resource';
import {
  InMemoryCustomerRepository,
  InMemorySupplierRepository,
} from '../infrastructure/in-memory.repositories';
import { CustomerService, SupplierService } from './party.service';

const actor: ActorContext = { organizationId: 'org-1', actorId: 'user-1' };
const otherTenant: ActorContext = { organizationId: 'org-2', actorId: 'user-2' };
const LIST: LookupListQuery = { page: 1, limit: 20, sort: 'name' };

class SeqIds implements ResourceIdGenerator {
  private n = 0;
  generate(): string {
    return `id-${++this.n}`;
  }
}
class FixedClock implements ResourceClock {
  now(): Date {
    return new Date('2026-01-01T00:00:00.000Z');
  }
}
class RecordingEvents implements ResourceEventPublisher {
  readonly events: ResourceEvent[] = [];
  publish(event: ResourceEvent): void {
    this.events.push(event);
  }
}

function makeSuppliers() {
  const repo = new InMemorySupplierRepository();
  return { repo, service: new SupplierService(repo, new SeqIds(), new FixedClock(), new RecordingEvents()) };
}
function makeCustomers() {
  const repo = new InMemoryCustomerRepository();
  return { repo, service: new CustomerService(repo, new SeqIds(), new FixedClock(), new RecordingEvents()) };
}

describe('SupplierService', () => {
  let ctx: ReturnType<typeof makeSuppliers>;
  beforeEach(() => {
    ctx = makeSuppliers();
  });

  it('creates a supplier with contact fields + address', async () => {
    const created = await ctx.service.create(actor, {
      name: 'Acme Supplies',
      code: 'ACME',
      email: 'sales@acme.test',
      address: { line1: '1 Main St', city: 'Springfield', country: 'us' },
      currency: 'USD',
      leadTimeDays: 7,
    });
    expect(created.code).toBe('ACME');
    expect(created.email).toBe('sales@acme.test');
    expect(created.address?.city).toBe('Springfield');
    expect(created.address?.country).toBe('US'); // upper-cased
    expect(created.leadTimeDays).toBe(7);
  });

  it('does NOT require unique names (two suppliers may share a name)', async () => {
    await ctx.service.create(actor, { name: 'Acme' });
    await expect(ctx.service.create(actor, { name: 'Acme' })).resolves.toBeDefined();
  });

  it('rejects a duplicate code (case-insensitive)', async () => {
    await ctx.service.create(actor, { name: 'Acme', code: 'ACME' });
    await expect(ctx.service.create(actor, { name: 'Acme 2', code: 'acme' })).rejects.toBeInstanceOf(
      DuplicateResourceError,
    );
  });

  it('drops an entirely-empty address to null', async () => {
    const created = await ctx.service.create(actor, { name: 'No Address', address: {} });
    expect(created.address).toBeNull();
  });

  it('isolates tenants', async () => {
    const created = await ctx.service.create(actor, { name: 'Acme', code: 'ACME' });
    await expect(ctx.service.get(otherTenant, created.id)).rejects.toBeInstanceOf(ResourceNotFoundError);
    // The same code is free in another tenant.
    await expect(ctx.service.create(otherTenant, { name: 'Acme', code: 'ACME' })).resolves.toBeDefined();
  });

  it('archives, restores (re-checking code), and soft-deletes', async () => {
    const created = await ctx.service.create(actor, { name: 'Acme', code: 'ACME' });
    expect((await ctx.service.archive(actor, created.id)).status).toBe('archived');
    expect((await ctx.service.restore(actor, created.id)).status).toBe('active');

    await ctx.service.remove(actor, created.id);
    await expect(ctx.service.get(actor, created.id)).rejects.toBeInstanceOf(ResourceNotFoundError);
    // Soft delete frees the code for reuse.
    await expect(ctx.service.create(actor, { name: 'Acme 2', code: 'ACME' })).resolves.toBeDefined();
  });

  it('lists tenant suppliers sorted by name', async () => {
    await ctx.service.create(actor, { name: 'Beta' });
    await ctx.service.create(actor, { name: 'Alpha' });
    const result = await ctx.service.list(actor, LIST);
    expect(result.total).toBe(2);
    expect(result.items[0]?.name).toBe('Alpha');
  });
});

describe('CustomerService', () => {
  it('stores the customer type and credit limit', async () => {
    const { service } = makeCustomers();
    const created = await service.create(actor, {
      name: 'Jane Doe',
      customerType: 'individual',
      creditLimitMinor: 50000,
      currency: 'USD',
    });
    expect(created.customerType).toBe('individual');
    expect(created.creditLimitMinor).toBe(50000);
  });
});
