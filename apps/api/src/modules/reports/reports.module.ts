import { Module } from '@nestjs/common';
import { CatalogModule } from '../catalog/catalog.module';
import { CatalogQuery } from '../catalog/application/catalog-query.service';
import { InventoryModule } from '../inventory/inventory.module';
import { InventoryQuery } from '../inventory/application/inventory-query.service';
import { LocationsModule } from '../locations/locations.module';
import { LocationQuery } from '../locations/application/location-query.service';
import {
  REPORTS_CATALOG,
  REPORTS_INVENTORY,
  REPORTS_LOCATION,
  type CatalogReadPort,
  type InventoryReadPort,
  type LocationReadPort,
} from './application/ports';
import { ReportsService } from './application/reports.service';
import { ReportController } from './presentation/report.controller';

/**
 * Reports module — read-only, cross-module analytics. Depends one-way on Inventory (stock projection), Catalog
 * (reorder-eligible variants) and Locations (warehouse grouping) — no writes, no cycles. The ports are bound by
 * identity to those modules' query services (which structurally satisfy them).
 */
@Module({
  imports: [InventoryModule, CatalogModule, LocationsModule],
  controllers: [ReportController],
  providers: [
    {
      provide: REPORTS_INVENTORY,
      inject: [InventoryQuery],
      useFactory: (inventory: InventoryQuery): InventoryReadPort => inventory,
    },
    {
      provide: REPORTS_CATALOG,
      inject: [CatalogQuery],
      useFactory: (catalog: CatalogQuery): CatalogReadPort => catalog,
    },
    {
      provide: REPORTS_LOCATION,
      inject: [LocationQuery],
      useFactory: (locations: LocationQuery): LocationReadPort => locations,
    },
    {
      provide: ReportsService,
      inject: [REPORTS_INVENTORY, REPORTS_CATALOG, REPORTS_LOCATION],
      useFactory: (
        inventory: InventoryReadPort,
        catalog: CatalogReadPort,
        locations: LocationReadPort,
      ): ReportsService => new ReportsService(inventory, catalog, locations),
    },
  ],
  exports: [ReportsService],
})
export class ReportsModule {}
