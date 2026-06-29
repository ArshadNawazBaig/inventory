import { Injectable } from '@nestjs/common';
import type { ActorContext } from '../../../common/auth';
import { InventoryService } from '../../inventory/application/inventory.service';
import { InventoryQuery } from '../../inventory/application/inventory-query.service';
import type { PosInventoryRef, PosStockPoster, SellLineCommand } from '../application/ports';

/**
 * Write adapter into Inventory — a POS sale posts a `shipment` movement (reason `pos_sale`) per line. Inventory
 * remains the single ledger writer and applies the negative-stock guard + idempotency on `opKey`.
 */
@Injectable()
export class InventorySalePoster implements PosStockPoster {
  constructor(private readonly inventory: InventoryService) {}

  async sell(ctx: ActorContext, cmd: SellLineCommand): Promise<void> {
    await this.inventory.postMovement(ctx, {
      variantId: cmd.variantId,
      locationId: cmd.locationId,
      delta: -cmd.quantity,
      type: 'shipment',
      reason: { kind: 'pos_sale', refId: cmd.refId, lineId: cmd.lineId },
      unitCostMinor: null,
      currency: null,
      note: null,
      opKey: cmd.opKey,
    });
  }
}

/** Read adapter into Inventory — available units at a (variant × location) cell, for POS pre-validation. */
@Injectable()
export class InventoryAvailabilityRef implements PosInventoryRef {
  constructor(private readonly inventory: InventoryQuery) {}

  availableAt(organizationId: string, variantId: string, locationId: string): Promise<number> {
    return this.inventory.availableAt(organizationId, variantId, locationId);
  }
}
