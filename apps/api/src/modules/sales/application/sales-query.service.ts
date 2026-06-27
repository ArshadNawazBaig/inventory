import { Inject, Injectable } from '@nestjs/common';
import { SALES_ORDER_STATUS, type SalesOrderStatus } from '@stockflow/types';
import { SALES_ORDER_REPOSITORY, type SalesOrderRepository } from './ports';

/** A `{ status, count }` tally for one sales-order status. */
export interface SalesOrderStatusCount {
  status: SalesOrderStatus;
  count: number;
}

/**
 * The public, read-only query surface other modules use to summarise sales — the same pattern as
 * InventoryQuery/CatalogQuery. Consumed by the Dashboard module (KPIs). Returns the **complete** status set
 * (count 0 for absent statuses) so callers render a stable breakdown without re-deriving the enum.
 */
@Injectable()
export class SalesQuery {
  constructor(
    @Inject(SALES_ORDER_REPOSITORY) private readonly repo: SalesOrderRepository,
  ) {}

  async countByStatus(organizationId: string): Promise<SalesOrderStatusCount[]> {
    const tally = await this.repo.countByStatus(organizationId);
    return SALES_ORDER_STATUS.map((status) => ({ status, count: tally[status] ?? 0 }));
  }
}
