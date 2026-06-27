import type { LookupStatus } from '@stockflow/types';

/**
 * Shared envelope for the catalog lookup entities (categories, brands, units). Persistence detail is
 * canonical in DATABASE §4; module-relevant fields + invariants shown here. Framework-free.
 */
export interface LookupEntity {
  id: string;
  organizationId: string;
  name: string;
  description: string | null;
  status: LookupStatus;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  createdBy: string | null;
  updatedBy: string | null;
}

/** A product classification; optionally nested under a parent category (one tree, acyclic). */
export interface CategoryEntity extends LookupEntity {
  parentId: string | null;
}

/** A product brand/manufacturer. */
export interface BrandEntity extends LookupEntity {
  website: string | null;
}

/** A unit of measure (e.g. `kg`, `ea`) referenced by products/variants. */
export interface UnitEntity extends LookupEntity {
  code: string;
}

export type LookupResource = 'category' | 'brand' | 'unit';
export type LookupAction = 'created' | 'updated' | 'archived' | 'restored' | 'deleted';

/** Domain event emitted after a successful lookup mutation (consumed by audit/search later). */
export interface LookupEvent {
  resource: LookupResource;
  action: LookupAction;
  organizationId: string;
  entityId: string;
}
