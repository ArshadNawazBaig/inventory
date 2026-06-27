import { Injectable } from '@nestjs/common';
import type { SalesOrderListQuery } from '@stockflow/types';
import type { SalesOrderEntity } from '../domain/entities';
import type { SalesOrderRepository } from '../application/ports';

/**
 * In-memory sales-order store — the runnable, fully-testable persistence until the database module lands.
 * Tenant-scoped; `nextNumber` mints a per-tenant `SO-0001` sequence. The Mongoose adapter implements the
 * same port without touching the application layer.
 */
@Injectable()
export class InMemorySalesOrderRepository implements SalesOrderRepository {
  private readonly store = new Map<string, SalesOrderEntity>();
  private readonly counters = new Map<string, number>();

  insert(order: SalesOrderEntity): Promise<SalesOrderEntity> {
    this.store.set(order.id, this.clone(order));
    return Promise.resolve(this.clone(order));
  }

  findById(organizationId: string, id: string): Promise<SalesOrderEntity | null> {
    const found = this.store.get(id);
    if (!found || found.organizationId !== organizationId) return Promise.resolve(null);
    return Promise.resolve(this.clone(found));
  }

  update(
    organizationId: string,
    id: string,
    patch: Partial<SalesOrderEntity>,
  ): Promise<SalesOrderEntity | null> {
    const found = this.store.get(id);
    if (!found || found.organizationId !== organizationId) return Promise.resolve(null);
    const next = { ...found, ...patch };
    this.store.set(id, next);
    return Promise.resolve(this.clone(next));
  }

  list(
    organizationId: string,
    query: SalesOrderListQuery,
  ): Promise<{ items: SalesOrderEntity[]; total: number }> {
    let items = [...this.store.values()].filter((order) => order.organizationId === organizationId);
    if (query.status) items = items.filter((order) => order.status === query.status);
    if (query.customerId) items = items.filter((order) => order.customerId === query.customerId);
    if (query.q) {
      const needle = query.q.toLowerCase();
      items = items.filter((order) => order.soNumber.toLowerCase().includes(needle));
    }
    items.sort(this.comparator(query.sort));

    const total = items.length;
    const start = (query.page - 1) * query.limit;
    const page = items.slice(start, start + query.limit).map((order) => this.clone(order));
    return Promise.resolve({ items: page, total });
  }

  countByStatus(organizationId: string): Promise<Record<string, number>> {
    const tally: Record<string, number> = {};
    for (const order of this.store.values()) {
      if (order.organizationId !== organizationId) continue;
      tally[order.status] = (tally[order.status] ?? 0) + 1;
    }
    return Promise.resolve(tally);
  }

  nextNumber(organizationId: string): Promise<string> {
    const next = (this.counters.get(organizationId) ?? 0) + 1;
    this.counters.set(organizationId, next);
    return Promise.resolve(`SO-${String(next).padStart(4, '0')}`);
  }

  private comparator(
    sort: SalesOrderListQuery['sort'],
  ): (a: SalesOrderEntity, b: SalesOrderEntity) => number {
    const descending = sort.startsWith('-');
    const field = (descending ? sort.slice(1) : sort) as 'createdAt' | 'soNumber';
    const direction = descending ? -1 : 1;
    return (a, b) => {
      const left = field === 'soNumber' ? a.soNumber : a.createdAt.getTime();
      const right = field === 'soNumber' ? b.soNumber : b.createdAt.getTime();
      if (left < right) return -1 * direction;
      if (left > right) return 1 * direction;
      return a.id < b.id ? -1 : 1;
    };
  }

  private clone(order: SalesOrderEntity): SalesOrderEntity {
    return { ...order, lines: order.lines.map((line) => ({ ...line })), totals: { ...order.totals } };
  }
}
