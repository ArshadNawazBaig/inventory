import { Injectable } from '@nestjs/common';
import type { ActorContext } from '../../../common/auth/actor-context';
import { InventoryService } from '../../inventory/application/inventory.service';
import type { MoveInCommand, MoveOutCommand, MoveOutResult, StockMover } from '../application/ports';

/**
 * Write adapter into Inventory — posts the two transfer legs. The outbound leg returns the source's captured
 * valuation (the running average is unchanged by an outbound move) so the inbound leg can land it at the
 * destination. Inventory remains the single ledger writer and applies the negative-stock guard at dispatch.
 */
@Injectable()
export class InventoryStockMover implements StockMover {
  constructor(private readonly inventory: InventoryService) {}

  async transferOut(ctx: ActorContext, cmd: MoveOutCommand): Promise<MoveOutResult> {
    const { level } = await this.inventory.transferOut(ctx, cmd);
    return { unitCostMinor: level.avgCostMinor, currency: level.currency };
  }

  async transferIn(ctx: ActorContext, cmd: MoveInCommand): Promise<void> {
    await this.inventory.transferIn(ctx, cmd);
  }
}
