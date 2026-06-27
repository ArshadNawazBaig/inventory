import type { LookupStatus } from '@stockflow/types';

/**
 * The fields every catalog lookup response shares. The concrete responses (Category/Brand/Unit) extend
 * this with one extra field each, so generic list/table/lifecycle code can operate on the common shape.
 */
export interface LookupRecord {
  id: string;
  name: string;
  description: string | null;
  status: LookupStatus;
  createdAt: string;
  updatedAt: string;
}
