import { Injectable } from '@nestjs/common';
import type { ReturnListQuery } from '@stockflow/types';
import type { ReturnEntity } from '../domain/entities';
import type { ReturnRepository } from '../application/ports';

/**
 * In-memory return store — the runnable, fully-testable persistence until the database module lands.
 * Tenant-scoped; `nextNumber` mints a per-tenant `RET-0001` sequence. The Mongoose adapter implements the same
 * port (the sequence becomes a counters collection, DATABASE §13.3) without touching the application.
 */
@Injectable()
export class InMemoryReturnRepository implements ReturnRepository {
  private readonly store = new Map<string, ReturnEntity>();
  private readonly counters = new Map<string, number>();

  insert(ret: ReturnEntity): Promise<ReturnEntity> {
    this.store.set(ret.id, this.clone(ret));
    return Promise.resolve(this.clone(ret));
  }

  findById(organizationId: string, id: string): Promise<ReturnEntity | null> {
    const found = this.store.get(id);
    if (!found || found.organizationId !== organizationId) return Promise.resolve(null);
    return Promise.resolve(this.clone(found));
  }

  update(
    organizationId: string,
    id: string,
    patch: Partial<ReturnEntity>,
  ): Promise<ReturnEntity | null> {
    const found = this.store.get(id);
    if (!found || found.organizationId !== organizationId) return Promise.resolve(null);
    const next = { ...found, ...patch };
    this.store.set(id, next);
    return Promise.resolve(this.clone(next));
  }

  list(
    organizationId: string,
    query: ReturnListQuery,
  ): Promise<{ items: ReturnEntity[]; total: number }> {
    let items = [...this.store.values()].filter((r) => r.organizationId === organizationId);
    if (query.kind) items = items.filter((r) => r.kind === query.kind);
    if (query.status) items = items.filter((r) => r.status === query.status);
    if (query.q) {
      const needle = query.q.toLowerCase();
      items = items.filter((r) => r.returnNumber.toLowerCase().includes(needle));
    }
    items.sort(this.comparator(query.sort));

    const total = items.length;
    const start = (query.page - 1) * query.limit;
    const page = items.slice(start, start + query.limit).map((r) => this.clone(r));
    return Promise.resolve({ items: page, total });
  }

  nextNumber(organizationId: string): Promise<string> {
    const next = (this.counters.get(organizationId) ?? 0) + 1;
    this.counters.set(organizationId, next);
    return Promise.resolve(`RET-${String(next).padStart(4, '0')}`);
  }

  private comparator(sort: ReturnListQuery['sort']): (a: ReturnEntity, b: ReturnEntity) => number {
    const descending = sort.startsWith('-');
    const field = (descending ? sort.slice(1) : sort) as 'createdAt' | 'returnNumber';
    const direction = descending ? -1 : 1;
    return (a, b) => {
      const left = field === 'returnNumber' ? a.returnNumber : a.createdAt.getTime();
      const right = field === 'returnNumber' ? b.returnNumber : b.createdAt.getTime();
      if (left < right) return -1 * direction;
      if (left > right) return 1 * direction;
      return a.id < b.id ? -1 : 1;
    };
  }

  /** Deep-clone so stored embedded lines can't be mutated by reference. */
  private clone(ret: ReturnEntity): ReturnEntity {
    return { ...ret, lines: ret.lines.map((line) => ({ ...line })) };
  }
}
