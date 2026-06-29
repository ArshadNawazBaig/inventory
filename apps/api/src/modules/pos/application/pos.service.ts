import { Inject, Injectable } from '@nestjs/common';
import type { CreateSaleRequest, SaleListQuery } from '@stockflow/types';
import type { ActorContext } from '../../../common/auth';
import type { ResourceClock, ResourceIdGenerator } from '../../../common/resource';
import type { PosSaleEntity, PosSaleLine } from '../domain/entities';
import { InsufficientPaymentError, InsufficientStockForSaleError } from '../domain/pos.errors';
import {
  POS_CLOCK,
  POS_ID_GENERATOR,
  POS_INVENTORY,
  POS_SALE_REPOSITORY,
  POS_STOCK_POSTER,
  type PosInventoryRef,
  type PosSaleRepository,
  type PosStockPoster,
} from './ports';

/**
 * Point-of-Sale use cases. A sale prices its lines, takes payment, **pre-validates stock at the selling
 * location** (retail never oversells), then posts one negative-guarded `shipment` movement per line through
 * Inventory (the single ledger writer) and records the immutable receipt. Tenant + cashier come from the
 * session, never the client.
 */
@Injectable()
export class PosService {
  constructor(
    @Inject(POS_SALE_REPOSITORY) private readonly sales: PosSaleRepository,
    @Inject(POS_STOCK_POSTER) private readonly stock: PosStockPoster,
    @Inject(POS_INVENTORY) private readonly inventory: PosInventoryRef,
    @Inject(POS_ID_GENERATOR) private readonly ids: ResourceIdGenerator,
    @Inject(POS_CLOCK) private readonly clock: ResourceClock,
  ) {}

  async createSale(ctx: ActorContext, input: CreateSaleRequest): Promise<PosSaleEntity> {
    const org = ctx.organizationId;

    const lines: PosSaleLine[] = input.lines.map((line) => ({
      variantId: line.variantId,
      quantity: line.quantity,
      unitPriceMinor: line.unitPriceMinor,
      lineTotalMinor: line.quantity * line.unitPriceMinor,
    }));
    const subtotalMinor = lines.reduce((sum, line) => sum + line.lineTotalMinor, 0);
    const totalMinor = subtotalMinor; // tax is a documented follow-up
    if (input.amountTenderedMinor < totalMinor) throw new InsufficientPaymentError();

    // Pre-validate availability for the whole basket (a variant may span multiple lines) before any write.
    const requiredByVariant = new Map<string, number>();
    for (const line of lines) {
      requiredByVariant.set(line.variantId, (requiredByVariant.get(line.variantId) ?? 0) + line.quantity);
    }
    for (const [variantId, required] of requiredByVariant) {
      if ((await this.inventory.availableAt(org, variantId, input.locationId)) < required) {
        throw new InsufficientStockForSaleError();
      }
    }

    const saleId = this.ids.generate();
    const receiptNumber = await this.sales.nextNumber(org);
    const now = this.clock.now();

    // Post the shipments (idempotent on opKey; negative-guarded by Inventory).
    for (let index = 0; index < lines.length; index += 1) {
      const line = lines[index]!;
      await this.stock.sell(ctx, {
        variantId: line.variantId,
        locationId: input.locationId,
        quantity: line.quantity,
        refId: saleId,
        lineId: String(index),
        opKey: `pos:${saleId}:${index}`,
      });
    }

    return this.sales.insert({
      id: saleId,
      organizationId: org,
      receiptNumber,
      locationId: input.locationId,
      customerId: input.customerId ?? null,
      currency: input.currency,
      lines,
      subtotalMinor,
      totalMinor,
      paymentMethod: input.paymentMethod,
      amountTenderedMinor: input.amountTenderedMinor,
      changeMinor: input.amountTenderedMinor - totalMinor,
      soldByUserId: ctx.actorId,
      note: input.note ?? null,
      createdAt: now,
    });
  }

  listSales(ctx: ActorContext, query: SaleListQuery): Promise<{ items: PosSaleEntity[]; total: number }> {
    return this.sales.list(ctx.organizationId, query);
  }

  getSale(ctx: ActorContext, id: string): Promise<PosSaleEntity | null> {
    return this.sales.findById(ctx.organizationId, id);
  }
}
