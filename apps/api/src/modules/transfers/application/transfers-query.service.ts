import { Inject, Injectable } from '@nestjs/common';
import { TRANSFER_STATUS, type TransferStatus } from '@stockflow/types';
import { TRANSFER_REPOSITORY, type TransferRepository } from './ports';

/** A `{ status, count }` tally for one transfer status. */
export interface TransferStatusCount {
  status: TransferStatus;
  count: number;
}

/**
 * The public, read-only query surface other modules use to summarise transfers — the same pattern as
 * InventoryQuery/CatalogQuery. Consumed by the Dashboard module (KPIs). Returns the **complete** status set
 * (count 0 for absent statuses) so callers render a stable breakdown without re-deriving the enum.
 */
@Injectable()
export class TransfersQuery {
  constructor(
    @Inject(TRANSFER_REPOSITORY) private readonly repo: TransferRepository,
  ) {}

  async countByStatus(organizationId: string): Promise<TransferStatusCount[]> {
    const tally = await this.repo.countByStatus(organizationId);
    return TRANSFER_STATUS.map((status) => ({ status, count: tally[status] ?? 0 }));
  }
}
