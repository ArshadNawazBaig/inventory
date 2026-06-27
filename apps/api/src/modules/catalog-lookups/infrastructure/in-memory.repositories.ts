import { Injectable } from '@nestjs/common';
import type { LookupListQuery } from '@stockflow/types';
import type { BrandEntity, CategoryEntity, LookupEntity, UnitEntity } from '../domain/entities';
import { codeKey, nameKey } from '../domain/name';
import type { LookupRepository, UnitRepository } from '../application/ports';

/**
 * Generic in-memory lookup store — the runnable, fully-testable persistence until the database module
 * lands. Tenant- and soft-delete-aware; name uniqueness is case-insensitive. Mongoose adapters implement
 * the same ports and drop in without touching the application layer (dependency inversion).
 */
class InMemoryLookupRepository<T extends LookupEntity> implements LookupRepository<T> {
  protected readonly store = new Map<string, T>();

  insert(entity: T): Promise<T> {
    this.store.set(entity.id, { ...entity });
    return Promise.resolve({ ...entity });
  }

  findById(organizationId: string, id: string, options?: { withDeleted?: boolean }): Promise<T | null> {
    const found = this.store.get(id);
    if (!found || found.organizationId !== organizationId) return Promise.resolve(null);
    if (found.deletedAt !== null && !options?.withDeleted) return Promise.resolve(null);
    return Promise.resolve({ ...found });
  }

  findLiveByName(organizationId: string, name: string): Promise<T | null> {
    const key = nameKey(name);
    const found = [...this.store.values()].find(
      (e) => e.organizationId === organizationId && e.deletedAt === null && nameKey(e.name) === key,
    );
    return Promise.resolve(found ? { ...found } : null);
  }

  update(organizationId: string, id: string, patch: Partial<T>): Promise<T | null> {
    const found = this.store.get(id);
    if (!found || found.organizationId !== organizationId) return Promise.resolve(null);
    const next = { ...found, ...patch };
    this.store.set(id, next);
    return Promise.resolve({ ...next });
  }

  list(organizationId: string, query: LookupListQuery): Promise<{ items: T[]; total: number }> {
    let items = [...this.store.values()].filter(
      (e) => e.organizationId === organizationId && e.deletedAt === null,
    );
    if (query.status) items = items.filter((e) => e.status === query.status);
    if (query.q) {
      const needle = query.q.toLowerCase();
      items = items.filter((e) => e.name.toLowerCase().includes(needle));
    }
    items.sort(this.comparator(query.sort));

    const total = items.length;
    const start = (query.page - 1) * query.limit;
    const page = items.slice(start, start + query.limit).map((e) => ({ ...e }));
    return Promise.resolve({ items: page, total });
  }

  private comparator(sort: LookupListQuery['sort']): (a: T, b: T) => number {
    const descending = sort.startsWith('-');
    const field = (descending ? sort.slice(1) : sort) as 'name' | 'createdAt' | 'updatedAt';
    const direction = descending ? -1 : 1;
    return (a, b) => {
      const left = field === 'name' ? a.name.toLowerCase() : a[field].getTime();
      const right = field === 'name' ? b.name.toLowerCase() : b[field].getTime();
      if (left < right) return -1 * direction;
      if (left > right) return 1 * direction;
      return a.id < b.id ? -1 : 1; // stable tiebreaker
    };
  }
}

@Injectable()
export class InMemoryCategoryRepository extends InMemoryLookupRepository<CategoryEntity> {}

@Injectable()
export class InMemoryBrandRepository extends InMemoryLookupRepository<BrandEntity> {}

@Injectable()
export class InMemoryUnitRepository
  extends InMemoryLookupRepository<UnitEntity>
  implements UnitRepository
{
  findLiveByCode(organizationId: string, code: string): Promise<UnitEntity | null> {
    const key = codeKey(code);
    const found = [...this.store.values()].find(
      (e) => e.organizationId === organizationId && e.deletedAt === null && codeKey(e.code) === key,
    );
    return Promise.resolve(found ? { ...found } : null);
  }
}
