import type { LocationType, SiteType } from '@stockflow/types';
import type { Address } from '../../../common/address';
import type { ResourceEntity } from '../../../common/resource';

/**
 * Locations domain entities — the shared envelope (`ResourceEntity`: id/org/name/status/audit) plus the
 * location-specific fields. Persistence detail is canonical in DATABASE §5 (ADR-004). Framework-free.
 */

/**
 * A physical site — a `warehouse` (back-stock) or a `store` (retail). Keyed by an optional unique `code` per
 * tenant; one site may be the default. Stores sell from their locations via Point-of-Sale.
 */
export interface WarehouseEntity extends ResourceEntity {
  type: SiteType;
  code: string | null;
  address: Address | null;
  isDefault: boolean;
}

/**
 * A node in a warehouse's Warehouse → Zone → … → Bin tree. `code` is unique within its warehouse; `path`
 * is the materialized slash-joined chain of ancestor codes (inclusive) for subtree roll-ups and display.
 */
export interface LocationEntity extends ResourceEntity {
  warehouseId: string;
  parentLocationId: string | null;
  path: string;
  code: string;
  type: LocationType;
}
