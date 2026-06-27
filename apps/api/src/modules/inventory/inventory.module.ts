import { Module } from '@nestjs/common';
import { ObjectIdGenerator, SystemClock } from '../../common/resource';
import { CatalogModule } from '../catalog/catalog.module';
import { CatalogQuery } from '../catalog/application/catalog-query.service';
import { LocationsModule } from '../locations/locations.module';
import { LocationQuery } from '../locations/application/location-query.service';
import {
  INVENTORY_CLOCK,
  INVENTORY_EVENT_PUBLISHER,
  INVENTORY_ID_GENERATOR,
  INVENTORY_POLICY,
  INVENTORY_REFERENCE,
  STOCK_LEVEL_REPOSITORY,
  STOCK_MOVEMENT_REPOSITORY,
  type InventoryClock,
  type InventoryEventPublisher,
  type InventoryIdGenerator,
  type InventoryPolicyPort,
  type InventoryReferencePort,
  type StockLevelRepository,
  type StockMovementRepository,
} from './application/ports';
import { InventoryService } from './application/inventory.service';
import { InventoryQuery } from './application/inventory-query.service';
import {
  InMemoryStockLevelRepository,
  InMemoryStockMovementRepository,
} from './infrastructure/in-memory.repositories';
import {
  CatalogLocationReference,
  DefaultInventoryPolicy,
  LoggingInventoryEventPublisher,
} from './infrastructure/adapters';
import { InventoryController } from './presentation/inventory.controller';

/**
 * Inventory module (the keystone). Owns the immutable stock ledger + the on-hand projection and is the
 * **only** module that writes the ledger. Depends one-way on Catalog (variant existence) and Locations
 * (location existence) — no cycle. Ports bound to in-memory adapters until the database module lands;
 * Mongoose adapters wrap the ledger+projection write in a session (DATABASE §11). Exports `InventoryQuery`
 * (the read-model) for future consumers.
 */
@Module({
  imports: [CatalogModule, LocationsModule],
  controllers: [InventoryController],
  providers: [
    { provide: STOCK_MOVEMENT_REPOSITORY, useClass: InMemoryStockMovementRepository },
    { provide: STOCK_LEVEL_REPOSITORY, useClass: InMemoryStockLevelRepository },
    { provide: INVENTORY_POLICY, useClass: DefaultInventoryPolicy },
    { provide: INVENTORY_ID_GENERATOR, useValue: new ObjectIdGenerator() },
    { provide: INVENTORY_CLOCK, useValue: new SystemClock() },
    { provide: INVENTORY_EVENT_PUBLISHER, useValue: new LoggingInventoryEventPublisher() },
    {
      provide: INVENTORY_REFERENCE,
      inject: [CatalogQuery, LocationQuery],
      useFactory: (catalog: CatalogQuery, locations: LocationQuery): InventoryReferencePort =>
        new CatalogLocationReference(catalog, locations),
    },
    {
      provide: InventoryService,
      inject: [
        STOCK_MOVEMENT_REPOSITORY,
        STOCK_LEVEL_REPOSITORY,
        INVENTORY_REFERENCE,
        INVENTORY_POLICY,
        INVENTORY_ID_GENERATOR,
        INVENTORY_CLOCK,
        INVENTORY_EVENT_PUBLISHER,
      ],
      useFactory: (
        movements: StockMovementRepository,
        levels: StockLevelRepository,
        references: InventoryReferencePort,
        policy: InventoryPolicyPort,
        ids: InventoryIdGenerator,
        clock: InventoryClock,
        events: InventoryEventPublisher,
      ): InventoryService =>
        new InventoryService(movements, levels, references, policy, ids, clock, events),
    },
    InventoryQuery,
  ],
  exports: [InventoryQuery],
})
export class InventoryModule {}
