import { describe, it, expect, beforeEach } from 'vitest';
import type { TransferListQuery } from '@stockflow/types';
import type { ActorContext } from '../../../common/auth/actor-context';
import { ResourceNotFoundError, type ResourceClock, type ResourceIdGenerator } from '../../../common/resource';
import { InMemoryTransferRepository } from '../infrastructure/in-memory.repository';
import {
  InvalidTransferLineError,
  InvalidTransferLocationError,
  OverReceiveTransferError,
  SameLocationError,
  TransferStateError,
} from '../domain/transfers.errors';
import type {
  CatalogRef,
  LocationRef,
  MoveInCommand,
  MoveOutCommand,
  MoveOutResult,
  StockMover,
  VariantSnapshot,
} from './ports';
import { TransfersService } from './transfers.service';

const actor: ActorContext = { organizationId: 'org-1', actorId: 'user-1' };
const otherTenant: ActorContext = { organizationId: 'org-2', actorId: 'user-2' };
const LIST: TransferListQuery = { page: 1, limit: 20, sort: '-createdAt' };
const SRC = 'a'.repeat(24);
const DST = 'b'.repeat(24);
const V1 = 'c'.repeat(24);
const V2 = 'd'.repeat(24);

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
class FakeCatalog implements CatalogRef {
  readonly snapshots = new Map<string, VariantSnapshot>([
    [V1, { sku: 'SKU-1', productName: 'Widget', defaultPriceMinor: 500, currency: 'USD' }],
    [V2, { sku: 'SKU-2', productName: 'Gadget', defaultPriceMinor: 800, currency: 'USD' }],
  ]);
  getVariantSnapshot(_org: string, variantId: string): Promise<VariantSnapshot | null> {
    return Promise.resolve(this.snapshots.get(variantId) ?? null);
  }
}
class FakeLocations implements LocationRef {
  exists = true;
  locationExists(): Promise<boolean> {
    return Promise.resolve(this.exists);
  }
  getLocationLabel(_org: string, id: string): Promise<string | null> {
    return Promise.resolve(id === SRC ? 'Main dock' : 'Overflow shelf');
  }
}
class RecordingMover implements StockMover {
  readonly out: MoveOutCommand[] = [];
  readonly in: MoveInCommand[] = [];
  result: MoveOutResult = { unitCostMinor: 1000, currency: 'USD' };
  outError: Error | null = null;
  transferOut(_ctx: ActorContext, cmd: MoveOutCommand): Promise<MoveOutResult> {
    if (this.outError) return Promise.reject(this.outError);
    this.out.push(cmd);
    return Promise.resolve(this.result);
  }
  transferIn(_ctx: ActorContext, cmd: MoveInCommand): Promise<void> {
    this.in.push(cmd);
    return Promise.resolve();
  }
}

function make() {
  const repo = new InMemoryTransferRepository();
  const catalog = new FakeCatalog();
  const locations = new FakeLocations();
  const mover = new RecordingMover();
  const service = new TransfersService(repo, catalog, locations, mover, new SeqIds(), new FixedClock());
  return { repo, catalog, locations, mover, service };
}

const draftInput = {
  sourceLocationId: SRC,
  destinationLocationId: DST,
  lines: [{ variantId: V1, quantity: 10 }],
};

describe('TransfersService.create', () => {
  let ctx: ReturnType<typeof make>;
  beforeEach(() => {
    ctx = make();
  });

  it('creates a draft transfer with snapshots, labels and a TR number', async () => {
    const transfer = await ctx.service.create(actor, draftInput);
    expect(transfer.transferNumber).toBe('TR-0001');
    expect(transfer.status).toBe('draft');
    expect(transfer.sourceLocationName).toBe('Main dock');
    expect(transfer.destinationLocationName).toBe('Overflow shelf');
    expect(transfer.lines[0]?.skuSnapshot).toBe('SKU-1');
    expect(transfer.lines[0]?.dispatchedQty).toBe(0);
    expect(transfer.lines[0]?.receivedQty).toBe(0);
    expect(transfer.lines[0]?.unitCostMinor).toBeNull();
  });

  it('rejects a same-location transfer', async () => {
    await expect(
      ctx.service.create(actor, { ...draftInput, destinationLocationId: SRC }),
    ).rejects.toBeInstanceOf(SameLocationError);
  });

  it('rejects an unknown location or variant', async () => {
    ctx.locations.exists = false;
    await expect(ctx.service.create(actor, draftInput)).rejects.toBeInstanceOf(InvalidTransferLocationError);
    ctx.locations.exists = true;
    await expect(
      ctx.service.create(actor, { ...draftInput, lines: [{ variantId: 'f'.repeat(24), quantity: 1 }] }),
    ).rejects.toBeInstanceOf(InvalidTransferLineError);
  });

  it('mints an incrementing per-tenant TR sequence', async () => {
    const first = await ctx.service.create(actor, draftInput);
    const second = await ctx.service.create(actor, draftInput);
    expect([first.transferNumber, second.transferNumber]).toEqual(['TR-0001', 'TR-0002']);
  });
});

describe('TransfersService lifecycle', () => {
  let ctx: ReturnType<typeof make>;
  beforeEach(() => {
    ctx = make();
  });

  it('dispatches a draft, posting transfer_out and capturing the source cost', async () => {
    const transfer = await ctx.service.create(actor, draftInput);
    const lineId = transfer.lines[0]!.id;
    const dispatched = await ctx.service.dispatch(actor, transfer.id);

    expect(dispatched.status).toBe('in_transit');
    expect(dispatched.lines[0]?.dispatchedQty).toBe(10);
    expect(dispatched.lines[0]?.unitCostMinor).toBe(1000);
    expect(ctx.mover.out[0]).toMatchObject({
      variantId: V1,
      locationId: SRC,
      quantity: 10,
      refId: transfer.id,
      lineId,
      opKey: `transfer:${transfer.id}:${lineId}:out`,
    });
  });

  it('refuses to dispatch anything but a draft', async () => {
    const transfer = await ctx.service.create(actor, draftInput);
    await ctx.service.dispatch(actor, transfer.id);
    await expect(ctx.service.dispatch(actor, transfer.id)).rejects.toBeInstanceOf(TransferStateError);
  });

  it('receives partially then fully, posting transfer_in at the captured cost into the destination', async () => {
    const transfer = await ctx.service.create(actor, draftInput);
    await ctx.service.dispatch(actor, transfer.id);
    const lineId = transfer.lines[0]!.id;

    const partial = await ctx.service.receive(actor, transfer.id, { lines: [{ lineId, quantity: 4 }] });
    expect(partial.status).toBe('partially_received');
    expect(partial.lines[0]?.receivedQty).toBe(4);
    expect(ctx.mover.in[0]).toMatchObject({
      variantId: V1,
      locationId: DST,
      quantity: 4,
      unitCostMinor: 1000,
      currency: 'USD',
      refId: transfer.id,
      lineId,
      opKey: `transfer:${transfer.id}:${lineId}:in:4`,
    });

    const full = await ctx.service.receive(actor, transfer.id, { lines: [{ lineId, quantity: 6 }] });
    expect(full.status).toBe('completed');
    expect(full.lines[0]?.receivedQty).toBe(10);
  });

  it('refuses to receive more than the in-transit quantity', async () => {
    const transfer = await ctx.service.create(actor, draftInput);
    await ctx.service.dispatch(actor, transfer.id);
    await expect(
      ctx.service.receive(actor, transfer.id, { lines: [{ lineId: transfer.lines[0]!.id, quantity: 11 }] }),
    ).rejects.toBeInstanceOf(OverReceiveTransferError);
  });

  it('refuses to receive a transfer that has not been dispatched', async () => {
    const transfer = await ctx.service.create(actor, draftInput);
    await expect(
      ctx.service.receive(actor, transfer.id, { lines: [{ lineId: transfer.lines[0]!.id, quantity: 1 }] }),
    ).rejects.toBeInstanceOf(TransferStateError);
  });

  it('cancels a draft but not a dispatched transfer', async () => {
    const transfer = await ctx.service.create(actor, draftInput);
    expect((await ctx.service.cancel(actor, transfer.id)).status).toBe('cancelled');

    const other = await ctx.service.create(actor, draftInput);
    await ctx.service.dispatch(actor, other.id);
    await expect(ctx.service.cancel(actor, other.id)).rejects.toBeInstanceOf(TransferStateError);
  });

  it('isolates tenants and lists', async () => {
    const transfer = await ctx.service.create(actor, draftInput);
    await expect(ctx.service.get(otherTenant, transfer.id)).rejects.toBeInstanceOf(ResourceNotFoundError);
    const list = await ctx.service.list(actor, LIST);
    expect(list.total).toBe(1);
  });
});
