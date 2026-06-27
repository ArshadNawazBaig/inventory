import type { LookupStatus } from '@stockflow/types';

/** Status shared by every managed resource (active | archived). */
export type ResourceStatus = LookupStatus;

/**
 * The standard envelope for a tenant-scoped, named, soft-deletable resource (catalog lookups, parties,
 * and future simple CRUD entities). Concrete entities extend this with their own fields. Framework-free.
 */
export interface ResourceEntity {
  id: string;
  organizationId: string;
  name: string;
  status: ResourceStatus;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  createdBy: string | null;
  updatedBy: string | null;
}

export type ResourceAction = 'created' | 'updated' | 'archived' | 'restored' | 'deleted';

/** Domain event emitted after a successful resource mutation (consumed by audit/search later). */
export interface ResourceEvent {
  resource: string;
  action: ResourceAction;
  organizationId: string;
  entityId: string;
}
