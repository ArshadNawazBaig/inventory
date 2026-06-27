import type { LookupListQuery } from '@stockflow/types';
import type { BrandEntity, CategoryEntity, LookupEntity, LookupEvent, UnitEntity } from '../domain/entities';

/** Generic, tenant-scoped persistence port for a lookup entity. Name lookups consider only live rows. */
export interface LookupRepository<T extends LookupEntity> {
  insert(entity: T): Promise<T>;
  findById(organizationId: string, id: string, options?: { withDeleted?: boolean }): Promise<T | null>;
  findLiveByName(organizationId: string, name: string): Promise<T | null>;
  update(organizationId: string, id: string, patch: Partial<T>): Promise<T | null>;
  list(organizationId: string, query: LookupListQuery): Promise<{ items: T[]; total: number }>;
}

export type CategoryRepository = LookupRepository<CategoryEntity>;
export type BrandRepository = LookupRepository<BrandEntity>;

export interface UnitRepository extends LookupRepository<UnitEntity> {
  /** Live unit with this code (case-insensitive) in the tenant, if any. */
  findLiveByCode(organizationId: string, code: string): Promise<UnitEntity | null>;
}

export interface LookupEventPublisher {
  publish(event: LookupEvent): void;
}

export interface IdGenerator {
  generate(): string;
}

export interface Clock {
  now(): Date;
}

// ─── DI tokens (framework-agnostic symbols; wired in catalog-lookups.module.ts) ──
export const CATEGORY_REPOSITORY = Symbol('CategoryRepository');
export const BRAND_REPOSITORY = Symbol('BrandRepository');
export const UNIT_REPOSITORY = Symbol('UnitRepository');
export const LOOKUP_EVENT_PUBLISHER = Symbol('LookupEventPublisher');
export const LOOKUP_ID_GENERATOR = Symbol('LookupIdGenerator');
export const LOOKUP_CLOCK = Symbol('LookupClock');
