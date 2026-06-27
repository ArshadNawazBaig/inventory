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
  PURCHASE_ORDER_REPOSITORY,
  PURCHASING_CATALOG,
  PURCHASING_CLOCK,
  PURCHASING_ID_GENERATOR,
  PURCHASING_LOCATION,
  PURCHASING_RECEIPT,
  PURCHASING_SUPPLIER,
  type CatalogRef,
  type PurchaseOrderRepository,
  type ReceiptPoster,
  type SupplierRef,
  type WarehouseLocationRef,
} from './application/ports';
import { PurchasingService } from './application/purchasing.service';
import { InMemoryPurchaseOrderRepository } from './infrastructure/in-memory.repository';
import { InventoryReceiptPoster } from './infrastructure/adapters';
import { PurchaseOrderController } from './presentation/purchase-order.controller';

/**
 * Purchasing module (Purchase Orders). Depends one-way on Catalog (variant snapshots), Parties (supplier),
 * Locations (warehouse/location) and Inventory (posting `receipt` movements) — no cycles. Ports bound to
 * in-memory + delegating adapters until the database module lands.
 */
@Module({
  imports: [CatalogModule, PartiesModule, LocationsModule, InventoryModule],
  controllers: [PurchaseOrderController],
  providers: [
    { provide: PURCHASE_ORDER_REPOSITORY, useClass: InMemoryPurchaseOrderRepository },
    { provide: PURCHASING_RECEIPT, useClass: InventoryReceiptPoster },
    { provide: PURCHASING_ID_GENERATOR, useValue: new ObjectIdGenerator() },
    { provide: PURCHASING_CLOCK, useValue: new SystemClock() },
    {
      provide: PURCHASING_CATALOG,
      inject: [CatalogQuery],
      useFactory: (catalog: CatalogQuery): CatalogRef => catalog,
    },
    {
      provide: PURCHASING_SUPPLIER,
      inject: [PartyQuery],
      useFactory: (parties: PartyQuery): SupplierRef => parties,
    },
    {
      provide: PURCHASING_LOCATION,
      inject: [LocationQuery],
      useFactory: (locations: LocationQuery): WarehouseLocationRef => locations,
    },
    {
      provide: PurchasingService,
      inject: [
        PURCHASE_ORDER_REPOSITORY,
        PURCHASING_CATALOG,
        PURCHASING_SUPPLIER,
        PURCHASING_LOCATION,
        PURCHASING_RECEIPT,
        PURCHASING_ID_GENERATOR,
        PURCHASING_CLOCK,
      ],
      useFactory: (
        repo: PurchaseOrderRepository,
        catalog: CatalogRef,
        suppliers: SupplierRef,
        locations: WarehouseLocationRef,
        receipts: ReceiptPoster,
        ids: ResourceIdGenerator,
        clock: ResourceClock,
      ): PurchasingService =>
        new PurchasingService(repo, catalog, suppliers, locations, receipts, ids, clock),
    },
  ],
})
export class PurchasingModule {}
