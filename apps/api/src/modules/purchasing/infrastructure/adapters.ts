import { Injectable } from '@nestjs/common';
import type { ActorContext } from '../../../common/auth/actor-context';
import { InventoryService } from '../../inventory/application/inventory.service';
import type { ReceiptPoster, ReceiveStockCommand } from '../application/ports';

/**
 * Write adapter into Inventory — posts a PO `receipt` movement (the only way stock enters from a PO).
 * Inventory remains the single ledger writer; Purchasing just hands it a typed command.
 */
@Injectable()
export class InventoryReceiptPoster implements ReceiptPoster {
  constructor(private readonly inventory: InventoryService) {}

  async receive(ctx: ActorContext, cmd: ReceiveStockCommand): Promise<void> {
    await this.inventory.receive(ctx, cmd);
  }
}
