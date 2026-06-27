import type { LocationType } from '@stockflow/types';
import type { Address } from '../../../common/address';
import type { ResourceEntity } from '../../../common/resource';

/**
 * Locations domain entities — the shared envelope (`ResourceEntity`: id/org/name/status/audit) plus the
 * location-specific fields. Persistence detail is canonical in DATABASE §5 (ADR-004). Framework-free.
 */

/** A physical site. Keyed by an optional unique `code` per tenant; one warehouse may be the default. */
export interface WarehouseEntity extends ResourceEntity {
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
