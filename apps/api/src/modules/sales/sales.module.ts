import { Module } from '@nestjs/common';
import {
  ObjectIdGenerator,
  SystemClock,
  type ResourceClock,
  type ResourceIdGenerator,
} from '../../common/resource';
import { CatalogModule } from '../catalog/catalog.module';
import { CatalogQuery } from '../catalog/application/catalog-query.service';
import { InventoryModule } from '../inventory/inventory.module';
import { LocationsModule } from '../locations/locations.module';
import { LocationQuery } from '../locations/application/location-query.service';
import { PartiesModule } from '../parties/parties.module';
import { PartyQuery } from '../parties/application/party-query.service';
import {
  SALES_CATALOG,
  SALES_CLOCK,
  SALES_CUSTOMER,
  SALES_ID_GENERATOR,
  SALES_LOCATION,
  SALES_ORDER_REPOSITORY,
  SALES_SHIPMENT,
  type CatalogRef,
  type CustomerRef,
  type SalesOrderRepository,
  type ShipmentPoster,
  type WarehouseLocationRef,
} from './application/ports';
import { SalesService } from './application/sales.service';
import { InMemorySalesOrderRepository } from './infrastructure/in-memory.repository';
import { InventoryShipmentPoster } from './infrastructure/adapters';
import { SalesOrderController } from './presentation/sales-order.controller';

/**
 * Sales module (Sales Orders). Depends one-way on Catalog (variant snapshots), Parties (customer),
 * Locations (warehouse/location) and Inventory (posting `shipment` movements) — no cycles. Ports bound to
 * in-memory + delegating adapters until the database module lands.
 */
@Module({
  imports: [CatalogModule, PartiesModule, LocationsModule, InventoryModule],
  controllers: [SalesOrderController],
  providers: [
    { provide: SALES_ORDER_REPOSITORY, useClass: InMemorySalesOrderRepository },
    { provide: SALES_SHIPMENT, useClass: InventoryShipmentPoster },
    { provide: SALES_ID_GENERATOR, useValue: new ObjectIdGenerator() },
    { provide: SALES_CLOCK, useValue: new SystemClock() },
    {
      provide: SALES_CATALOG,
      inject: [CatalogQuery],
      useFactory: (catalog: CatalogQuery): CatalogRef => catalog,
    },
    {
      provide: SALES_CUSTOMER,
      inject: [PartyQuery],
      useFactory: (parties: PartyQuery): CustomerRef => parties,
    },
    {
      provide: SALES_LOCATION,
      inject: [LocationQuery],
      useFactory: (locations: LocationQuery): WarehouseLocationRef => locations,
    },
    {
      provide: SalesService,
      inject: [
        SALES_ORDER_REPOSITORY,
        SALES_CATALOG,
        SALES_CUSTOMER,
        SALES_LOCATION,
        SALES_SHIPMENT,
        SALES_ID_GENERATOR,
        SALES_CLOCK,
      ],
      useFactory: (
        repo: SalesOrderRepository,
        catalog: CatalogRef,
        customers: CustomerRef,
        locations: WarehouseLocationRef,
        shipments: ShipmentPoster,
        ids: ResourceIdGenerator,
        clock: ResourceClock,
      ): SalesService => new SalesService(repo, catalog, customers, locations, shipments, ids, clock),
    },
  ],
})
export class SalesModule {}
