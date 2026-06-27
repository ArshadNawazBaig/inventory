import { Injectable } from '@nestjs/common';
import type { LocationListQuery } from '@stockflow/types';
import { InMemoryResourceRepository } from '../../../common/resource';
import type { LocationEntity, WarehouseEntity } from '../domain/entities';
import type { LocationRepository, WarehouseRepository } from '../application/ports';

/**
 * In-memory warehouse store — the generic resource repository specialised, plus the default-site lookup.
 * Tenant- and soft-delete-aware; code uniqueness (via `findLiveByField`) is case-insensitive.
 */
@Injectable()
export class InMemoryWarehouseRepository
  extends InMemoryResourceRepository<WarehouseEntity>
  implements WarehouseRepository
{
  findDefault(organizationId: string): Promise<WarehouseEntity | null> {
    const found = [...this.store.values()].find(
      (warehouse) =>
        warehouse.organizationId === organizationId && warehouse.deletedAt === null && warehouse.isDefault,
    );
    return Promise.resolve(found ? { ...found } : null);
  }
}

/**
 * In-memory location store — bespoke (codes are unique within a warehouse; the entity is a per-warehouse
 * tree). Tenant- and soft-delete-aware. The Mongoose adapter implements the same port and drops in later.
 */
@Injectable()
export class InMemoryLocationRepository implements LocationRepository {
  private readonly store = new Map<string, LocationEntity>();

  insert(entity: LocationEntity): Promise<LocationEntity> {
    this.store.set(entity.id, { ...entity });
    return Promise.resolve({ ...entity });
  }

  findById(
    organizationId: string,
    id: string,
    options?: { withDeleted?: boolean },
  ): Promise<LocationEntity | null> {
    const found = this.store.get(id);
    if (!found || found.organizationId !== organizationId) return Promise.resolve(null);
    if (found.deletedAt !== null && !options?.withDeleted) return Promise.resolve(null);
    return Promise.resolve({ ...found });
  }

  findLiveByCodeInWarehouse(
    organizationId: string,
    warehouseId: string,
    code: string,
  ): Promise<LocationEntity | null> {
    const key = code.trim().toLowerCase();
    const found = [...this.store.values()].find(
      (location) =>
        location.organizationId === organizationId &&
        location.deletedAt === null &&
        location.warehouseId === warehouseId &&
        location.code.toLowerCase() === key,
    );
    return Promise.resolve(found ? { ...found } : null);
  }

  findLiveChildren(organizationId: string, parentLocationId: string): Promise<LocationEntity[]> {
    const items = [...this.store.values()]
      .filter(
        (location) =>
          location.organizationId === organizationId &&
          location.deletedAt === null &&
          location.parentLocationId === parentLocationId,
      )
      .map((location) => ({ ...location }));
    return Promise.resolve(items);
  }

  update(organizationId: string, id: string, patch: Partial<LocationEntity>): Promise<LocationEntity | null> {
    const found = this.store.get(id);
    if (!found || found.organizationId !== organizationId) return Promise.resolve(null);
    const next = { ...found, ...patch };
    this.store.set(id, next);
    return Promise.resolve({ ...next });
  }

  list(
    organizationId: string,
    query: LocationListQuery,
  ): Promise<{ items: LocationEntity[]; total: number }> {
    let items = [...this.store.values()].filter(
      (location) => location.organizationId === organizationId && location.deletedAt === null,
    );
    if (query.warehouseId) items = items.filter((location) => location.warehouseId === query.warehouseId);
    if (query.parentLocationId) {
      items = items.filter((location) => location.parentLocationId === query.parentLocationId);
    }
    if (query.type) items = items.filter((location) => location.type === query.type);
    if (query.status) items = items.filter((location) => location.status === query.status);
    if (query.q) {
      const needle = query.q.toLowerCase();
      items = items.filter(
        (location) =>
          location.name.toLowerCase().includes(needle) || location.code.toLowerCase().includes(needle),
      );
    }
    items.sort(this.comparator(query.sort));

    const total = items.length;
    const start = (query.page - 1) * query.limit;
    const page = items.slice(start, start + query.limit).map((location) => ({ ...location }));
    return Promise.resolve({ items: page, total });
  }

  countAll(organizationId: string): Promise<number> {
    let count = 0;
    for (const location of this.store.values()) {
      if (location.organizationId === organizationId && location.deletedAt === null) count += 1;
    }
    return Promise.resolve(count);
  }

  private comparator(sort: LocationListQuery['sort']): (a: LocationEntity, b: LocationEntity) => number {
    const descending = sort.startsWith('-');
    const field = (descending ? sort.slice(1) : sort) as 'path' | 'code' | 'name' | 'createdAt' | 'updatedAt';
    const direction = descending ? -1 : 1;
    return (a, b) => {
      const left = field === 'createdAt' || field === 'updatedAt' ? a[field].getTime() : a[field].toLowerCase();
      const right = field === 'createdAt' || field === 'updatedAt' ? b[field].getTime() : b[field].toLowerCase();
      if (left < right) return -1 * direction;
      if (left > right) return 1 * direction;
      return a.id < b.id ? -1 : 1; // stable tiebreaker
    };
  }
}
