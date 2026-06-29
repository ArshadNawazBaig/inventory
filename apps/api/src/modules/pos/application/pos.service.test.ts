import { beforeEach, describe, expect, it } from 'vitest';
import type { ActorContext } from '../../../common/auth';
import type { ResourceClock, ResourceIdGenerator } from '../../../common/resource';
import { InMemoryPosSaleRepository } from '../infrastructure/in-memory.repository';
import { InsufficientPaymentError, InsufficientStockForSaleError } from '../domain/pos.errors';
import type { PosInventoryRef, PosStockPoster, SellLineCommand } from './ports';
import { PosService } from './pos.service';

const actor: ActorContext = { organizationId: 'org-1', actorId: 'user-1' };
const L = 'loc-1';
const V1 = 'variant-1';
const V2 = 'variant-2';

class SeqIds implements ResourceIdGenerator {
  private n = 0;
  generate(): string {
    return `sale-${++this.n}`;
  }
}
class FixedClock implements ResourceClock {
  now(): Date {
    return new Date('2026-06-01T00:00:00.000Z');
  }
}
class RecordingPoster implements PosStockPoster {
  readonly posted: SellLineCommand[] = [];
  sell(_ctx: ActorContext, cmd: SellLineCommand): Promise<void> {
    this.posted.push(cmd);
    return Promise.resolve();
  }
}
class FakeInventory implements PosInventoryRef {
  private readonly stock = new Map<string, number>();
  set(variantId: string, locationId: string, qty: number): void {
    this.stock.set(`${variantId}@${locationId}`, qty);
  }
  availableAt(_org: string, variantId: string, locationId: string): Promise<number> {
    return Promise.resolve(this.stock.get(`${variantId}@${locationId}`) ?? 0);
  }
}

function make() {
  const sales = new InMemoryPosSaleRepository();
  const poster = new RecordingPoster();
  const inventory = new FakeInventory();
  const service = new PosService(sales, poster, inventory, new SeqIds(), new FixedClock());
  return { sales, poster, inventory, service };
}

const base = {
  locationId: L,
  currency: 'USD',
  paymentMethod: 'cash' as const,
};

describe('PosService.createSale', () => {
  let ctx: ReturnType<typeof make>;
  beforeEach(() => {
    ctx = make();
    ctx.inventory.set(V1, L, 10);
    ctx.inventory.set(V2, L, 10);
  });

  it('prices lines, takes payment, posts a shipment per line, and records a receipt', async () => {
    const sale = await ctx.service.createSale(actor, {
      ...base,
      lines: [
        { variantId: V1, quantity: 2, unitPriceMinor: 500 },
        { variantId: V2, quantity: 1, unitPriceMinor: 1000 },
      ],
      amountTenderedMinor: 2000,
    });

    expect(sale.subtotalMinor).toBe(2000);
    expect(sale.totalMinor).toBe(2000);
    expect(sale.changeMinor).toBe(0);
    expect(sale.receiptNumber).toBe('RC-0001');
    expect(sale.customerId).toBeNull(); // walk-in
    expect(sale.soldByUserId).toBe('user-1');
    expect(sale.lines).toHaveLength(2);
    expect(sale.lines[0]?.lineTotalMinor).toBe(1000);

    // One negative-guarded shipment per line, idempotency-keyed to the sale.
    expect(ctx.poster.posted).toHaveLength(2);
    expect(ctx.poster.posted[0]).toMatchObject({ variantId: V1, quantity: 2, opKey: `pos:${sale.id}:0` });
    expect(await ctx.service.getSale(actor, sale.id)).toEqual(sale);
  });

  it('returns change when over-tendered', async () => {
    const sale = await ctx.service.createSale(actor, {
      ...base,
      lines: [{ variantId: V1, quantity: 1, unitPriceMinor: 1500 }],
      amountTenderedMinor: 2000,
    });
    expect(sale.changeMinor).toBe(500);
  });

  it('rejects underpayment and posts nothing', async () => {
    await expect(
      ctx.service.createSale(actor, {
        ...base,
        lines: [{ variantId: V1, quantity: 1, unitPriceMinor: 1500 }],
        amountTenderedMinor: 1000,
      }),
    ).rejects.toBeInstanceOf(InsufficientPaymentError);
    expect(ctx.poster.posted).toHaveLength(0);
  });

  it('refuses to oversell (insufficient stock) and posts nothing', async () => {
    ctx.inventory.set(V1, L, 1);
    await expect(
      ctx.service.createSale(actor, {
        ...base,
        lines: [{ variantId: V1, quantity: 2, unitPriceMinor: 500 }],
        amountTenderedMinor: 1000,
      }),
    ).rejects.toBeInstanceOf(InsufficientStockForSaleError);
    expect(ctx.poster.posted).toHaveLength(0);
  });

  it('aggregates the same variant across lines when checking stock', async () => {
    ctx.inventory.set(V1, L, 3);
    await expect(
      ctx.service.createSale(actor, {
        ...base,
        lines: [
          { variantId: V1, quantity: 2, unitPriceMinor: 500 },
          { variantId: V1, quantity: 2, unitPriceMinor: 500 },
        ],
        amountTenderedMinor: 2000,
      }),
    ).rejects.toBeInstanceOf(InsufficientStockForSaleError); // 4 > 3
  });

  it('mints incrementing per-tenant receipt numbers', async () => {
    const first = await ctx.service.createSale(actor, {
      ...base,
      lines: [{ variantId: V1, quantity: 1, unitPriceMinor: 100 }],
      amountTenderedMinor: 100,
    });
    const second = await ctx.service.createSale(actor, {
      ...base,
      lines: [{ variantId: V1, quantity: 1, unitPriceMinor: 100 }],
      amountTenderedMinor: 100,
    });
    expect([first.receiptNumber, second.receiptNumber]).toEqual(['RC-0001', 'RC-0002']);
  });
});
