import type { ResourceRepository } from '../../../common/resource';
import type { BrandEntity, CategoryEntity, UnitEntity } from '../domain/entities';

/** Per-type repositories are the generic resource repository specialised to each entity. */
export type CategoryRepository = ResourceRepository<CategoryEntity>;
export type BrandRepository = ResourceRepository<BrandEntity>;
export type UnitRepository = ResourceRepository<UnitEntity>;

// ─── DI tokens (framework-agnostic symbols; wired in catalog-lookups.module.ts) ──
export const CATEGORY_REPOSITORY = Symbol('CategoryRepository');
export const BRAND_REPOSITORY = Symbol('BrandRepository');
export const UNIT_REPOSITORY = Symbol('UnitRepository');
export const LOOKUP_EVENT_PUBLISHER = Symbol('LookupEventPublisher');
export const LOOKUP_ID_GENERATOR = Symbol('LookupIdGenerator');
export const LOOKUP_CLOCK = Symbol('LookupClock');
