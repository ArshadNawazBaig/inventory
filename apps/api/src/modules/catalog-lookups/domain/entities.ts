import type { ResourceEntity } from '../../../common/resource';

/**
 * Catalog lookup entities — the shared envelope (`ResourceEntity`) plus a `description` and one
 * type-specific field each. Persistence detail is canonical in DATABASE §4. Framework-free.
 */

/** A product classification; optionally nested under a parent category (one tree, acyclic). */
export interface CategoryEntity extends ResourceEntity {
  description: string | null;
  parentId: string | null;
}

/** A product brand/manufacturer. */
export interface BrandEntity extends ResourceEntity {
  description: string | null;
  website: string | null;
}

/** A unit of measure (e.g. `kg`, `ea`) referenced by products/variants. */
export interface UnitEntity extends ResourceEntity {
  description: string | null;
  code: string;
}
