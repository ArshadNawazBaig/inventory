import type { LocationListQuery } from '@stockflow/types';
import type { ResourceRepository } from '../../../common/resource';
import type { LocationEntity, WarehouseEntity } from '../domain/entities';

/**
 * Warehouse repository = the generic resource repository (name/code keyed, tenant-scoped, soft-delete)
 * plus a default-site lookup used to keep the at-most-one-default-per-tenant invariant.
 */
export interface WarehouseRepository extends ResourceRepository<WarehouseEntity> {
  findDefault(organizationId: string): Promise<WarehouseEntity | null>;
}

/**
 * Location repository — bespoke (not the generic name-keyed shape): codes are unique *within a warehouse*
 * and the entity is a per-warehouse tree. `findLiveByCodeInWarehouse` and `findLiveChildren` are
 * case-insensitive / live-only. The Mongoose adapter implements the same port and drops in later.
 */
export interface LocationRepository {
  insert(entity: LocationEntity): Promise<LocationEntity>;
  findById(
    organizationId: string,
    id: string,
    options?: { withDeleted?: boolean },
  ): Promise<LocationEntity | null>;
  findLiveByCodeInWarehouse(
    organizationId: string,
    warehouseId: string,
    code: string,
  ): Promise<LocationEntity | null>;
  findLiveChildren(organizationId: string, parentLocationId: string): Promise<LocationEntity[]>;
  update(organizationId: string, id: string, patch: Partial<LocationEntity>): Promise<LocationEntity | null>;
  list(organizationId: string, query: LocationListQuery): Promise<{ items: LocationEntity[]; total: number }>;
}

// ─── DI tokens (framework-agnostic symbols; wired in locations.module.ts) ────────
export const WAREHOUSE_REPOSITORY = Symbol('WarehouseRepository');
export const LOCATION_REPOSITORY = Symbol('LocationRepository');
export const LOCATIONS_EVENT_PUBLISHER = Symbol('LocationsEventPublisher');
export const LOCATIONS_ID_GENERATOR = Symbol('LocationsIdGenerator');
export const LOCATIONS_CLOCK = Symbol('LocationsClock');
