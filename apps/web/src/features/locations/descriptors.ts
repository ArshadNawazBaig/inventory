import {
  WarehouseListResponseSchema,
  WarehouseResponseSchema,
  type WarehouseResponse,
} from '@stockflow/types';
import type { ResourceDescriptor } from '@/features/resources/descriptor';

/**
 * Warehouses are a managed resource (named, status'd, code-keyed) → they use the generic resource toolkit.
 * Locations are warehouse-scoped tree nodes → they use the bespoke api/query/mutation hooks in this feature.
 */
export const WAREHOUSES: ResourceDescriptor<WarehouseResponse> = {
  resource: 'warehouses',
  singular: 'Warehouse',
  plural: 'Warehouses',
  responseSchema: WarehouseResponseSchema,
  listSchema: WarehouseListResponseSchema,
};
