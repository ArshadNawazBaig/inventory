import type { CustomerType } from '@stockflow/types';
import type { ResourceEntity } from '../../../common/resource';

/** Embedded postal address (every sub-field optional). */
export interface Address {
  line1: string | null;
  line2: string | null;
  city: string | null;
  region: string | null;
  postalCode: string | null;
  country: string | null;
}

/** Shared contact envelope for an external business party. Framework-free. */
export interface PartyEntity extends ResourceEntity {
  code: string | null;
  email: string | null;
  phone: string | null;
  website: string | null;
  taxId: string | null;
  notes: string | null;
  address: Address | null;
}

/** A vendor we buy from (referenced by Purchase Orders). */
export interface SupplierEntity extends PartyEntity {
  currency: string | null;
  paymentTerms: string | null;
  leadTimeDays: number | null;
}

/** A buyer we sell to (referenced by Sales Orders). */
export interface CustomerEntity extends PartyEntity {
  customerType: CustomerType;
  creditLimitMinor: number | null;
  currency: string | null;
}
