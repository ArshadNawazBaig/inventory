import type { ResourceRepository } from '../../../common/resource';
import type { CustomerEntity, SupplierEntity } from '../domain/entities';

export type SupplierRepository = ResourceRepository<SupplierEntity>;
export type CustomerRepository = ResourceRepository<CustomerEntity>;

// ─── DI tokens ─────────────────────────────────────────────────────────────────
export const SUPPLIER_REPOSITORY = Symbol('SupplierRepository');
export const CUSTOMER_REPOSITORY = Symbol('CustomerRepository');
export const PARTY_EVENT_PUBLISHER = Symbol('PartyEventPublisher');
export const PARTY_ID_GENERATOR = Symbol('PartyIdGenerator');
export const PARTY_CLOCK = Symbol('PartyClock');
