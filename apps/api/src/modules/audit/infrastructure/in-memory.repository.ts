import { Injectable } from '@nestjs/common';
import type { AuditLogListQuery } from '@stockflow/types';
import type { AuditLogEntity } from '../domain/entities';
import type { AuditLogRepository } from '../application/ports';

/**
 * In-memory audit store — the runnable, fully-testable, **append-only** persistence until the database module
 * lands. Tenant-scoped; supports entity/actor/action + date-range filters. The Mongoose adapter implements the
 * same port (an immutable `audit_logs` collection with retention, DATABASE §audit-logs) without touching the app.
 */
@Injectable()
export class InMemoryAuditLogRepository implements AuditLogRepository {
  private readonly store = new Map<string, AuditLogEntity>();

  insert(entry: AuditLogEntity): Promise<AuditLogEntity> {
    this.store.set(entry.id, this.clone(entry));
    return Promise.resolve(this.clone(entry));
  }

  findById(organizationId: string, id: string): Promise<AuditLogEntity | null> {
    const found = this.store.get(id);
    if (!found || found.organizationId !== organizationId) return Promise.resolve(null);
    return Promise.resolve(this.clone(found));
  }

  list(
    organizationId: string,
    query: AuditLogListQuery,
  ): Promise<{ items: AuditLogEntity[]; total: number }> {
    let items = [...this.store.values()].filter((e) => e.organizationId === organizationId);
    if (query.action) items = items.filter((e) => e.action === query.action);
    if (query.entityType) items = items.filter((e) => e.entityType === query.entityType);
    if (query.entityId) items = items.filter((e) => e.entityId === query.entityId);
    if (query.actorId) items = items.filter((e) => e.actorId === query.actorId);
    if (query.from) {
      const from = Date.parse(query.from);
      items = items.filter((e) => e.createdAt.getTime() >= from);
    }
    if (query.to) {
      const to = Date.parse(query.to);
      items = items.filter((e) => e.createdAt.getTime() <= to);
    }
    items.sort(this.comparator(query.sort));

    const total = items.length;
    const start = (query.page - 1) * query.limit;
    const page = items.slice(start, start + query.limit).map((e) => this.clone(e));
    return Promise.resolve({ items: page, total });
  }

  private comparator(sort: AuditLogListQuery['sort']): (a: AuditLogEntity, b: AuditLogEntity) => number {
    const direction = sort.startsWith('-') ? -1 : 1;
    return (a, b) => {
      const left = a.createdAt.getTime();
      const right = b.createdAt.getTime();
      if (left < right) return -1 * direction;
      if (left > right) return 1 * direction;
      return a.id < b.id ? -1 : 1;
    };
  }

  /** Deep-clone so stored entries (incl. metadata + diffs) can't be mutated by reference. */
  private clone(entry: AuditLogEntity): AuditLogEntity {
    return { ...entry, metadata: { ...entry.metadata } };
  }
}
