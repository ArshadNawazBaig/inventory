import { Injectable } from '@nestjs/common';
import { InMemoryResourceRepository } from '../../../common/resource';
import type { CustomerEntity, SupplierEntity } from '../domain/entities';

/** In-memory party stores — the generic resource repository specialised per entity (until the DB module). */
@Injectable()
export class InMemorySupplierRepository extends InMemoryResourceRepository<SupplierEntity> {}

@Injectable()
export class InMemoryCustomerRepository extends InMemoryResourceRepository<CustomerEntity> {}
