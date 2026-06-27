import { Module } from '@nestjs/common';
import type {
  ResourceClock,
  ResourceEventPublisher,
  ResourceIdGenerator,
} from '../../common/resource';
import {
  CUSTOMER_REPOSITORY,
  type CustomerRepository,
  PARTY_CLOCK,
  PARTY_EVENT_PUBLISHER,
  PARTY_ID_GENERATOR,
  SUPPLIER_REPOSITORY,
  type SupplierRepository,
} from './application/ports';
import { CustomerService, SupplierService } from './application/party.service';
import {
  InMemoryCustomerRepository,
  InMemorySupplierRepository,
} from './infrastructure/in-memory.repositories';
import {
  LoggingPartyEventPublisher,
  ObjectIdGenerator,
  SystemClock,
} from './infrastructure/adapters';
import { CustomerController, SupplierController } from './presentation/parties.controllers';

/**
 * Parties module (Suppliers · Customers). Built on the shared `common/resource` base; ports bound to
 * in-memory adapters until the database module lands. Purchasing/Sales will add a `PartyQuery` export
 * when they need to validate `supplierId`/`customerId`.
 */
@Module({
  controllers: [SupplierController, CustomerController],
  providers: [
    { provide: SUPPLIER_REPOSITORY, useClass: InMemorySupplierRepository },
    { provide: CUSTOMER_REPOSITORY, useClass: InMemoryCustomerRepository },
    { provide: PARTY_ID_GENERATOR, useClass: ObjectIdGenerator },
    { provide: PARTY_CLOCK, useClass: SystemClock },
    { provide: PARTY_EVENT_PUBLISHER, useClass: LoggingPartyEventPublisher },
    {
      provide: SupplierService,
      inject: [SUPPLIER_REPOSITORY, PARTY_ID_GENERATOR, PARTY_CLOCK, PARTY_EVENT_PUBLISHER],
      useFactory: (
        repo: SupplierRepository,
        ids: ResourceIdGenerator,
        clock: ResourceClock,
        events: ResourceEventPublisher,
      ): SupplierService => new SupplierService(repo, ids, clock, events),
    },
    {
      provide: CustomerService,
      inject: [CUSTOMER_REPOSITORY, PARTY_ID_GENERATOR, PARTY_CLOCK, PARTY_EVENT_PUBLISHER],
      useFactory: (
        repo: CustomerRepository,
        ids: ResourceIdGenerator,
        clock: ResourceClock,
        events: ResourceEventPublisher,
      ): CustomerService => new CustomerService(repo, ids, clock, events),
    },
  ],
})
export class PartiesModule {}
