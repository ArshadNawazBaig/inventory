import type { ZodType } from 'zod';
import type { PageMeta } from '@stockflow/types';
import type { ResourceRecord } from './types';

/**
 * Everything the generic toolkit needs to talk to one resource: its REST path segment, display names,
 * and the shared Zod contracts for output validation. One descriptor per resource; the generic
 * api/query/manager code is parameterised by it.
 */
export interface ResourceDescriptor<T extends ResourceRecord> {
  resource: string;
  singular: string;
  plural: string;
  responseSchema: ZodType<T>;
  listSchema: ZodType<{ data: T[]; meta: PageMeta }>;
}
