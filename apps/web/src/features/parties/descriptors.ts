import {
  CustomerListResponseSchema,
  CustomerResponseSchema,
  SupplierListResponseSchema,
  SupplierResponseSchema,
  type CustomerResponse,
  type SupplierResponse,
} from '@stockflow/types';
import type { ResourceDescriptor } from '@/features/resources/descriptor';

/** Resource descriptors for the two party types — consumed by the generic resource toolkit. */
export const SUPPLIERS: ResourceDescriptor<SupplierResponse> = {
  resource: 'suppliers',
  singular: 'Supplier',
  plural: 'Suppliers',
  responseSchema: SupplierResponseSchema,
  listSchema: SupplierListResponseSchema,
};

export const CUSTOMERS: ResourceDescriptor<CustomerResponse> = {
  resource: 'customers',
  singular: 'Customer',
  plural: 'Customers',
  responseSchema: CustomerResponseSchema,
  listSchema: CustomerListResponseSchema,
};
