import { Injectable } from '@nestjs/common';
import type { TransferListQuery } from '@stockflow/types';
import type { TransferEntity } from '../domain/entities';
import type { TransferRepository } from '../application/ports';

/**
 * In-memory transfer store — the runnable, fully-testable persistence until the database module lands.
 * Tenant-scoped; `nextNumber` mints a per-tenant `TR-0001` sequence. The Mongoose adapter implements the same
 * port (the sequence becomes a counters collection, DATABASE §13.3) without touching the application.
 */
@Injectable()
export class InMemoryTransferRepository implements TransferRepository {
  private readonly store = new Map<string, TransferEntity>();
  private readonly counters = new Map<string, number>();

  insert(transfer: TransferEntity): Promise<TransferEntity> {
    this.store.set(transfer.id, this.clone(transfer));
    return Promise.resolve(this.clone(transfer));
  }

  findById(organizationId: string, id: string): Promise<TransferEntity | null> {
    const found = this.store.get(id);
    if (!found || found.organizationId !== organizationId) return Promise.resolve(null);
    return Promise.resolve(this.clone(found));
  }

  update(
    organizationId: string,
    id: string,
    patch: Partial<TransferEntity>,
  ): Promise<TransferEntity | null> {
    const found = this.store.get(id);
    if (!found || found.organizationId !== organizationId) return Promise.resolve(null);
    const next = { ...found, ...patch };
    this.store.set(id, next);
    return Promise.resolve(this.clone(next));
  }

  list(
    organizationId: string,
    query: TransferListQuery,
  ): Promise<{ items: TransferEntity[]; total: number }> {
    let items = [...this.store.values()].filter((t) => t.organizationId === organizationId);
    if (query.status) items = items.filter((t) => t.status === query.status);
    if (query.q) {
      const needle = query.q.toLowerCase();
      items = items.filter((t) => t.transferNumber.toLowerCase().includes(needle));
    }
    items.sort(this.comparator(query.sort));

    const total = items.length;
    const start = (query.page - 1) * query.limit;
    const page = items.slice(start, start + query.limit).map((t) => this.clone(t));
    return Promise.resolve({ items: page, total });
  }

  nextNumber(organizationId: string): Promise<string> {
    const next = (this.counters.get(organizationId) ?? 0) + 1;
    this.counters.set(organizationId, next);
    return Promise.resolve(`TR-${String(next).padStart(4, '0')}`);
  }

  private comparator(
    sort: TransferListQuery['sort'],
  ): (a: TransferEntity, b: TransferEntity) => number {
    const descending = sort.startsWith('-');
    const field = (descending ? sort.slice(1) : sort) as 'createdAt' | 'transferNumber';
    const direction = descending ? -1 : 1;
    return (a, b) => {
      const left = field === 'transferNumber' ? a.transferNumber : a.createdAt.getTime();
      const right = field === 'transferNumber' ? b.transferNumber : b.createdAt.getTime();
      if (left < right) return -1 * direction;
      if (left > right) return 1 * direction;
      return a.id < b.id ? -1 : 1;
    };
  }

  /** Deep-clone so stored embedded lines can't be mutated by reference. */
  private clone(transfer: TransferEntity): TransferEntity {
    return { ...transfer, lines: transfer.lines.map((line) => ({ ...line })) };
  }
}
