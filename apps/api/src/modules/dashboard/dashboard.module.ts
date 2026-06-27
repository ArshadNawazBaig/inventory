import { Module } from '@nestjs/common';
import { CatalogModule } from '../catalog/catalog.module';
import { CatalogQuery } from '../catalog/application/catalog-query.service';
import { InventoryModule } from '../inventory/inventory.module';
import { InventoryQuery } from '../inventory/application/inventory-query.service';
import { LocationsModule } from '../locations/locations.module';
import { LocationQuery } from '../locations/application/location-query.service';
import { PurchasingModule } from '../purchasing/purchasing.module';
import { PurchasingQuery } from '../purchasing/application/purchasing-query.service';
import { ReportsModule } from '../reports/reports.module';
import { ReportsService } from '../reports/application/reports.service';
import { SalesModule } from '../sales/sales.module';
import { SalesQuery } from '../sales/application/sales-query.service';
import { TransfersModule } from '../transfers/transfers.module';
import { TransfersQuery } from '../transfers/application/transfers-query.service';
import {
  DASHBOARD_CATALOG,
  DASHBOARD_INVENTORY,
  DASHBOARD_LOCATION,
  DASHBOARD_PURCHASING,
  DASHBOARD_REPORTS,
  DASHBOARD_SALES,
  DASHBOARD_TRANSFERS,
  type CatalogLookupPort,
  type InventoryFeedPort,
  type LocationLookupPort,
  type OrderCountPort,
  type ReportsReadPort,
} from './application/ports';
import { DashboardService } from './application/dashboard.service';
import { DashboardController } from './presentation/dashboard.controller';

/**
 * Dashboard module — read-only overview. Depends one-way on Reports (valuation + low-stock, reused not
 * re-derived), Purchasing/Sales/Transfers (status counts), Inventory (recent ledger feed), and Catalog +
 * Locations (feed enrichment) — no writes, no cycles. The ports are bound by identity to those modules'
 * services (which structurally satisfy them).
 */
@Module({
  imports: [
    ReportsModule,
    PurchasingModule,
    SalesModule,
    TransfersModule,
    InventoryModule,
    CatalogModule,
    LocationsModule,
  ],
  controllers: [DashboardController],
  providers: [
    {
      provide: DASHBOARD_REPORTS,
      inject: [ReportsService],
      useFactory: (reports: ReportsService): ReportsReadPort => reports,
    },
    {
      provide: DASHBOARD_PURCHASING,
      inject: [PurchasingQuery],
      useFactory: (purchasing: PurchasingQuery): OrderCountPort => purchasing,
    },
    {
      provide: DASHBOARD_SALES,
      inject: [SalesQuery],
      useFactory: (sales: SalesQuery): OrderCountPort => sales,
    },
    {
      provide: DASHBOARD_TRANSFERS,
      inject: [TransfersQuery],
      useFactory: (transfers: TransfersQuery): OrderCountPort => transfers,
    },
    {
      provide: DASHBOARD_INVENTORY,
      inject: [InventoryQuery],
      useFactory: (inventory: InventoryQuery): InventoryFeedPort => inventory,
    },
    {
      provide: DASHBOARD_CATALOG,
      inject: [CatalogQuery],
      useFactory: (catalog: CatalogQuery): CatalogLookupPort => catalog,
    },
    {
      provide: DASHBOARD_LOCATION,
      inject: [LocationQuery],
      useFactory: (locations: LocationQuery): LocationLookupPort => locations,
    },
    {
      provide: DashboardService,
      inject: [
        DASHBOARD_REPORTS,
        DASHBOARD_PURCHASING,
        DASHBOARD_SALES,
        DASHBOARD_TRANSFERS,
        DASHBOARD_INVENTORY,
        DASHBOARD_CATALOG,
        DASHBOARD_LOCATION,
      ],
      useFactory: (
        reports: ReportsReadPort,
        purchasing: OrderCountPort,
        sales: OrderCountPort,
        transfers: OrderCountPort,
        inventory: InventoryFeedPort,
        catalog: CatalogLookupPort,
        locations: LocationLookupPort,
      ): DashboardService =>
        new DashboardService(reports, purchasing, sales, transfers, inventory, catalog, locations),
    },
  ],
})
export class DashboardModule {}
