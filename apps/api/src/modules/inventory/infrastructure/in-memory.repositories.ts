import { Injectable } from '@nestjs/common';
import type { StockLevelListQuery, StockMovementListQuery } from '@stockflow/types';
import type { StockLevelEntity, StockMovementEntity } from '../domain/entities';
import type { StockLevelRepository, StockMovementRepository } from '../application/ports';

function cellKey(variantId: string, locationId: string): string {
  return `${variantId}:${locationId}`;
}

/**
 * In-memory append-only ledger — the runnable, fully-testable persistence until the database module lands.
 * Movements are only ever inserted (never updated/deleted), preserving the immutability invariant.
 */
@Injectable()
export class InMemoryStockMovementRepository implements StockMovementRepository {
  private readonly entries: StockMovementEntity[] = [];

  insert(movement: StockMovementEntity): Promise<StockMovementEntity> {
    this.entries.push({ ...movement, reason: { ...movement.reason } });
    return Promise.resolve({ ...movement, reason: { ...movement.reason } });
  }

  findByOpKey(organizationId: string, opKey: string): Promise<StockMovementEntity | null> {
    const found = this.entries.find((m) => m.organizationId === organizationId && m.opKey === opKey);
    return Promise.resolve(found ? { ...found, reason: { ...found.reason } } : null);
  }

  list(
    organizationId: string,
    query: StockMovementListQuery,
  ): Promise<{ items: StockMovementEntity[]; total: number }> {
    let items = this.entries.filter((m) => m.organizationId === organizationId);
    if (query.variantId) items = items.filter((m) => m.variantId === query.variantId);
    if (query.locationId) items = items.filter((m) => m.locationId === query.locationId);
    if (query.type) items = items.filter((m) => m.type === query.type);

    const descending = query.sort.startsWith('-');
    const direction = descending ? -1 : 1;
    items = [...items].sort((a, b) => {
      const diff = a.createdAt.getTime() - b.createdAt.getTime();
      if (diff !== 0) return diff * direction;
      return (a.id < b.id ? -1 : 1) * direction;
    });

    const total = items.length;
    const start = (query.page - 1) * query.limit;
    const page = items.slice(start, start + query.limit).map((m) => ({ ...m, reason: { ...m.reason } }));
    return Promise.resolve({ items: page, total });
  }

  listByVariantLocation(
    organizationId: string,
    variantId: string,
    locationId: string,
  ): Promise<StockMovementEntity[]> {
    const items = this.entries
      .filter(
        (m) => m.organizationId === organizationId && m.variantId === variantId && m.locationId === locationId,
      )
      .map((m) => ({ ...m, reason: { ...m.reason } }));
    return Promise.resolve(items);
  }
}

/**
 * In-memory projection store — one row per (variant × location). Upserted in the same unit of work as the
 * ledger write by the service. Mongoose adapter implements the same port and drops in unchanged.
 */
@Injectable()
export class InMemoryStockLevelRepository implements StockLevelRepository {
  private readonly store = new Map<string, StockLevelEntity>();

  findByCell(
    organizationId: string,
    variantId: string,
    locationId: string,
  ): Promise<StockLevelEntity | null> {
    const found = this.store.get(cellKey(variantId, locationId));
    if (!found || found.organizationId !== organizationId) return Promise.resolve(null);
    return Promise.resolve({ ...found });
  }

  upsert(level: StockLevelEntity): Promise<StockLevelEntity> {
    this.store.set(cellKey(level.variantId, level.locationId), { ...level });
    return Promise.resolve({ ...level });
  }

  list(
    organizationId: string,
    query: StockLevelListQuery,
  ): Promise<{ items: StockLevelEntity[]; total: number }> {
    let items = [...this.store.values()].filter((l) => l.organizationId === organizationId);
    if (query.variantId) items = items.filter((l) => l.variantId === query.variantId);
    if (query.locationId) items = items.filter((l) => l.locationId === query.locationId);
    items.sort(this.comparator(query.sort));

    const total = items.length;
    const start = (query.page - 1) * query.limit;
    const page = items.slice(start, start + query.limit).map((l) => ({ ...l }));
    return Promise.resolve({ items: page, total });
  }

  listByVariant(organizationId: string, variantId: string): Promise<StockLevelEntity[]> {
    const items = [...this.store.values()]
      .filter((l) => l.organizationId === organizationId && l.variantId === variantId)
      .map((l) => ({ ...l }));
    return Promise.resolve(items);
  }

  private comparator(sort: StockLevelListQuery['sort']): (a: StockLevelEntity, b: StockLevelEntity) => number {
    const descending = sort.startsWith('-');
    const field = (descending ? sort.slice(1) : sort) as 'onHand' | 'available' | 'updatedAt';
    const direction = descending ? -1 : 1;
    return (a, b) => {
      const left = field === 'updatedAt' ? a.updatedAt.getTime() : a[field];
      const right = field === 'updatedAt' ? b.updatedAt.getTime() : b[field];
      if (left < right) return -1 * direction;
      if (left > right) return 1 * direction;
      return cellKey(a.variantId, a.locationId) < cellKey(b.variantId, b.locationId) ? -1 : 1;
    };
  }
}
