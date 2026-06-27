import { Inject, Injectable } from '@nestjs/common';
import { PURCHASE_ORDER_STATUS, type PurchaseOrderStatus } from '@stockflow/types';
import { PURCHASE_ORDER_REPOSITORY, type PurchaseOrderRepository } from './ports';

/** A `{ status, count }` tally for one purchase-order status. */
export interface PurchaseOrderStatusCount {
  status: PurchaseOrderStatus;
  count: number;
}

/**
 * The public, read-only query surface other modules use to summarise purchasing — the same pattern as
 * InventoryQuery/CatalogQuery. Consumed by the Dashboard module (KPIs). Returns the **complete** status set
 * (count 0 for absent statuses) so callers render a stable breakdown without re-deriving the enum.
 */
@Injectable()
export class PurchasingQuery {
  constructor(
    @Inject(PURCHASE_ORDER_REPOSITORY) private readonly repo: PurchaseOrderRepository,
  ) {}

  async countByStatus(organizationId: string): Promise<PurchaseOrderStatusCount[]> {
    const tally = await this.repo.countByStatus(organizationId);
    return PURCHASE_ORDER_STATUS.map((status) => ({ status, count: tally[status] ?? 0 }));
  }
}
