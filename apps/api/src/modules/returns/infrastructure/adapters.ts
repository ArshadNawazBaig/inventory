import { Injectable } from '@nestjs/common';
import type { ActorContext } from '../../../common/auth/actor-context';
import { InventoryService } from '../../inventory/application/inventory.service';
import type { ReturnPoster, ReturnStockCommand } from '../application/ports';

/**
 * Write adapter into Inventory — posts return movements. A customer return adds stock (`return_in`); a supplier
 * return removes it (`return_out`, negative-guarded). Inventory remains the single ledger writer.
 */
@Injectable()
export class InventoryReturnPoster implements ReturnPoster {
  constructor(private readonly inventory: InventoryService) {}

  async returnInbound(ctx: ActorContext, cmd: ReturnStockCommand): Promise<void> {
    await this.inventory.returnInbound(ctx, cmd);
  }

  async returnOutbound(ctx: ActorContext, cmd: ReturnStockCommand): Promise<void> {
    await this.inventory.returnOutbound(ctx, cmd);
  }
}
