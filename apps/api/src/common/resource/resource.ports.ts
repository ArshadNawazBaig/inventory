import type { LookupListQuery } from '@stockflow/types';
import type { ResourceEntity, ResourceEvent } from './resource.entity';

/**
 * Generic, tenant-scoped persistence port for a managed resource. `findLiveByName`/`findLiveByField`
 * consider only live (non-deleted) rows and match case-insensitively (uniqueness).
 */
export interface ResourceRepository<T extends ResourceEntity> {
  insert(entity: T): Promise<T>;
  findById(organizationId: string, id: string, options?: { withDeleted?: boolean }): Promise<T | null>;
  findLiveByName(organizationId: string, name: string): Promise<T | null>;
  findLiveByField(organizationId: string, field: string, value: string): Promise<T | null>;
  update(organizationId: string, id: string, patch: Partial<T>): Promise<T | null>;
  list(organizationId: string, query: LookupListQuery): Promise<{ items: T[]; total: number }>;
}

export interface ResourceIdGenerator {
  generate(): string;
}

export interface ResourceClock {
  now(): Date;
}

export interface ResourceEventPublisher {
  publish(event: ResourceEvent): void;
}
