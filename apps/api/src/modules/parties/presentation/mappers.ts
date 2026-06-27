import type { CustomerResponse, SupplierResponse } from '@stockflow/types';
import type { CustomerEntity, PartyEntity, SupplierEntity } from '../domain/entities';

/** Shared party envelope mapper (domain → response); no entity leakage to clients. The domain `Address`
 * already matches the response shape (all-nullable), so it passes through. */
function partyBase(entity: PartyEntity) {
  return {
    id: entity.id,
    name: entity.name,
    code: entity.code,
    email: entity.email,
    phone: entity.phone,
    website: entity.website,
    taxId: entity.taxId,
    notes: entity.notes,
    address: entity.address,
    status: entity.status,
    createdAt: entity.createdAt.toISOString(),
    updatedAt: entity.updatedAt.toISOString(),
  };
}

export function toSupplierResponse(entity: SupplierEntity): SupplierResponse {
  return {
    ...partyBase(entity),
    currency: entity.currency,
    paymentTerms: entity.paymentTerms,
    leadTimeDays: entity.leadTimeDays,
  };
}

export function toCustomerResponse(entity: CustomerEntity): CustomerResponse {
  return {
    ...partyBase(entity),
    customerType: entity.customerType,
    creditLimitMinor: entity.creditLimitMinor,
    currency: entity.currency,
  };
}
