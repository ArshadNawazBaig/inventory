import { Injectable } from '@nestjs/common';
import type { SaleListQuery } from '@stockflow/types';
import type { PosSaleEntity } from '../domain/entities';
import type { PosSaleRepository } from '../application/ports';

/**
 * In-memory POS sale store — runnable, fully-testable persistence (the default driver). Tenant-scoped;
 * `nextNumber` mints a per-tenant `RC-0001` receipt sequence. The Mongoose adapter implements the same port.
 */
@Injectable()
export class InMemoryPosSaleRepository implements PosSaleRepository {
  private readonly store = new Map<string, PosSaleEntity>();
  private readonly sequences = new Map<string, number>();

  insert(sale: PosSaleEntity): Promise<PosSaleEntity> {
    this.store.set(sale.id, this.clone(sale));
    return Promise.resolve(this.clone(sale));
  }

  findById(organizationId: string, id: string): Promise<PosSaleEntity | null> {
    const found = this.store.get(id);
    if (!found || found.organizationId !== organizationId) return Promise.resolve(null);
    return Promise.resolve(this.clone(found));
  }

  list(
    organizationId: string,
    query: SaleListQuery,
  ): Promise<{ items: PosSaleEntity[]; total: number }> {
    let items = [...this.store.values()].filter((s) => s.organizationId === organizationId);
    if (query.locationId) items = items.filter((s) => s.locationId === query.locationId);
    const direction = query.sort.startsWith('-') ? -1 : 1;
    items.sort((a, b) => {
      const diff = a.createdAt.getTime() - b.createdAt.getTime();
      return (diff !== 0 ? diff : a.id < b.id ? -1 : 1) * direction;
    });

    const total = items.length;
    const start = (query.page - 1) * query.limit;
    const page = items.slice(start, start + query.limit).map((s) => this.clone(s));
    return Promise.resolve({ items: page, total });
  }

  nextNumber(organizationId: string): Promise<string> {
    const next = (this.sequences.get(organizationId) ?? 0) + 1;
    this.sequences.set(organizationId, next);
    return Promise.resolve(`RC-${String(next).padStart(4, '0')}`);
  }

  private clone(sale: PosSaleEntity): PosSaleEntity {
    return { ...sale, lines: sale.lines.map((line) => ({ ...line })) };
  }
}
