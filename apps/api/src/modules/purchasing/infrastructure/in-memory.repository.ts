import { Injectable } from '@nestjs/common';
import type { PurchaseOrderListQuery } from '@stockflow/types';
import type { PurchaseOrderEntity } from '../domain/entities';
import type { PurchaseOrderRepository } from '../application/ports';

/**
 * In-memory purchase-order store — the runnable, fully-testable persistence until the database module lands.
 * Tenant-scoped; `nextNumber` mints a per-tenant `PO-0001` sequence. The Mongoose adapter implements the
 * same port (the sequence becomes a counters collection, DATABASE §13.3) without touching the application.
 */
@Injectable()
export class InMemoryPurchaseOrderRepository implements PurchaseOrderRepository {
  private readonly store = new Map<string, PurchaseOrderEntity>();
  private readonly counters = new Map<string, number>();

  insert(order: PurchaseOrderEntity): Promise<PurchaseOrderEntity> {
    this.store.set(order.id, this.clone(order));
    return Promise.resolve(this.clone(order));
  }

  findById(organizationId: string, id: string): Promise<PurchaseOrderEntity | null> {
    const found = this.store.get(id);
    if (!found || found.organizationId !== organizationId) return Promise.resolve(null);
    return Promise.resolve(this.clone(found));
  }

  update(
    organizationId: string,
    id: string,
    patch: Partial<PurchaseOrderEntity>,
  ): Promise<PurchaseOrderEntity | null> {
    const found = this.store.get(id);
    if (!found || found.organizationId !== organizationId) return Promise.resolve(null);
    const next = { ...found, ...patch };
    this.store.set(id, next);
    return Promise.resolve(this.clone(next));
  }

  list(
    organizationId: string,
    query: PurchaseOrderListQuery,
  ): Promise<{ items: PurchaseOrderEntity[]; total: number }> {
    let items = [...this.store.values()].filter((order) => order.organizationId === organizationId);
    if (query.status) items = items.filter((order) => order.status === query.status);
    if (query.supplierId) items = items.filter((order) => order.supplierId === query.supplierId);
    if (query.q) {
      const needle = query.q.toLowerCase();
      items = items.filter((order) => order.poNumber.toLowerCase().includes(needle));
    }
    items.sort(this.comparator(query.sort));

    const total = items.length;
    const start = (query.page - 1) * query.limit;
    const page = items.slice(start, start + query.limit).map((order) => this.clone(order));
    return Promise.resolve({ items: page, total });
  }

  nextNumber(organizationId: string): Promise<string> {
    const next = (this.counters.get(organizationId) ?? 0) + 1;
    this.counters.set(organizationId, next);
    return Promise.resolve(`PO-${String(next).padStart(4, '0')}`);
  }

  private comparator(
    sort: PurchaseOrderListQuery['sort'],
  ): (a: PurchaseOrderEntity, b: PurchaseOrderEntity) => number {
    const descending = sort.startsWith('-');
    const field = (descending ? sort.slice(1) : sort) as 'createdAt' | 'poNumber';
    const direction = descending ? -1 : 1;
    return (a, b) => {
      const left = field === 'poNumber' ? a.poNumber : a.createdAt.getTime();
      const right = field === 'poNumber' ? b.poNumber : b.createdAt.getTime();
      if (left < right) return -1 * direction;
      if (left > right) return 1 * direction;
      return a.id < b.id ? -1 : 1;
    };
  }

  /** Deep-clone so stored embedded lines can't be mutated by reference. */
  private clone(order: PurchaseOrderEntity): PurchaseOrderEntity {
    return { ...order, lines: order.lines.map((line) => ({ ...line })), totals: { ...order.totals } };
  }
}
