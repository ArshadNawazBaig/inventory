import { Inject, Injectable } from '@nestjs/common';
import {
  CUSTOMER_REPOSITORY,
  SUPPLIER_REPOSITORY,
  type CustomerRepository,
  type SupplierRepository,
} from './ports';

/**
 * The public, read-only query surface other modules use to validate + snapshot party references. Purchasing
 * binds to `supplierExists`/`getSupplierName`; Sales to `customerExists`/`getCustomerName`. Existence means
 * "live in this tenant" (soft-deleted parties don't exist; archived ones still do).
 */
@Injectable()
export class PartyQuery {
  constructor(
    @Inject(SUPPLIER_REPOSITORY) private readonly suppliers: SupplierRepository,
    @Inject(CUSTOMER_REPOSITORY) private readonly customers: CustomerRepository,
  ) {}

  async supplierExists(organizationId: string, id: string): Promise<boolean> {
    return Boolean(await this.suppliers.findById(organizationId, id));
  }

  async customerExists(organizationId: string, id: string): Promise<boolean> {
    return Boolean(await this.customers.findById(organizationId, id));
  }

  async getSupplierName(organizationId: string, id: string): Promise<string | null> {
    const supplier = await this.suppliers.findById(organizationId, id);
    return supplier?.name ?? null;
  }

  async getCustomerName(organizationId: string, id: string): Promise<string | null> {
    const customer = await this.customers.findById(organizationId, id);
    return customer?.name ?? null;
  }
}
