import { Inject, Injectable } from '@nestjs/common';
import {
  LOCATION_REPOSITORY,
  WAREHOUSE_REPOSITORY,
  type LocationRepository,
  type WarehouseRepository,
} from './ports';

/**
 * The public, read-only query surface other modules use to validate location references. The Inventory
 * module (stock is tracked at a `locationId`) will bind its reference port to an adapter delegating here —
 * the same pattern the Product module uses with `CatalogLookupQuery`. Existence means "live in this tenant".
 */
@Injectable()
export class LocationQuery {
  constructor(
    @Inject(WAREHOUSE_REPOSITORY) private readonly warehouses: WarehouseRepository,
    @Inject(LOCATION_REPOSITORY) private readonly locations: LocationRepository,
  ) {}

  async warehouseExists(organizationId: string, id: string): Promise<boolean> {
    return Boolean(await this.warehouses.findById(organizationId, id));
  }

  async locationExists(organizationId: string, id: string): Promise<boolean> {
    return Boolean(await this.locations.findById(organizationId, id));
  }

  /** The warehouse a location belongs to (used to assert a receipt/shipment targets the order's site). */
  async findWarehouseId(organizationId: string, locationId: string): Promise<string | null> {
    const location = await this.locations.findById(organizationId, locationId);
    return location?.warehouseId ?? null;
  }
}
