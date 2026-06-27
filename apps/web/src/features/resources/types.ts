import type { LookupStatus } from '@stockflow/types';

/** Status shared by every managed resource (active | archived). */
export type ResourceStatus = LookupStatus;

/**
 * The minimal shape the generic resource toolkit (list/table/lifecycle/picker) needs from any managed
 * resource: an id, a display name, a status, and audit timestamps. Concrete responses (Category, Brand,
 * Unit, Supplier, Customer, …) all satisfy this, so one set of admin code serves them all.
 */
export interface ResourceRecord {
  id: string;
  name: string;
  status: ResourceStatus;
  createdAt: string;
  updatedAt: string;
}
