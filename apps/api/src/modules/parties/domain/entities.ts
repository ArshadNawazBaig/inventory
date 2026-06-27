import type { CustomerType } from '@stockflow/types';
import type { Address } from '../../../common/address';
import type { ResourceEntity } from '../../../common/resource';

export type { Address };

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
