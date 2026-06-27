import { Injectable } from '@nestjs/common';
import type { ActorContext } from '../../../common/auth/actor-context';
import { InventoryService } from '../../inventory/application/inventory.service';
import type { ShipmentPoster, ShipStockCommand } from '../application/ports';

/**
 * Write adapter into Inventory — posts an SO `shipment` movement (the only way stock leaves from an SO).
 * Inventory remains the single ledger writer and applies the negative-stock guard.
 */
@Injectable()
export class InventoryShipmentPoster implements ShipmentPoster {
  constructor(private readonly inventory: InventoryService) {}

  async ship(ctx: ActorContext, cmd: ShipStockCommand): Promise<void> {
    await this.inventory.ship(ctx, cmd);
  }
}
