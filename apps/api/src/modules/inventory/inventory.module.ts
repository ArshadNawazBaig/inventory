import { Module } from '@nestjs/common';
import { ObjectIdGenerator, SystemClock } from '../../common/resource';
import { isMongo, mongoFeature, repositoryProvider } from '../../common/persistence';
import { CatalogModule } from '../catalog/catalog.module';
import { CatalogQuery } from '../catalog/application/catalog-query.service';
import { LocationsModule } from '../locations/locations.module';
import { LocationQuery } from '../locations/application/location-query.service';
import { SettingsModule } from '../settings/settings.module';
import { SettingsQuery } from '../settings/application/settings-query.service';
import {
  INVENTORY_CLOCK,
  INVENTORY_EVENT_PUBLISHER,
  INVENTORY_ID_GENERATOR,
  INVENTORY_POLICY,
  INVENTORY_REFERENCE,
  LEDGER_WRITER,
  STOCK_LEVEL_REPOSITORY,
  STOCK_MOVEMENT_REPOSITORY,
  type InventoryClock,
  type InventoryEventPublisher,
  type InventoryIdGenerator,
  type InventoryPolicyPort,
  type InventoryReferencePort,
  type LedgerWriter,
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
  InMemoryLedgerWriter,
  LoggingInventoryEventPublisher,
  SettingsInventoryPolicy,
} from './infrastructure/adapters';
import {
  MongoStockLevelRepository,
  MongoStockMovementRepository,
} from './infrastructure/mongoose/mongo.repositories';
import { MongoLedgerWriter } from './infrastructure/mongoose/ledger-writer';
import {
  LEVEL_MODEL,
  MOVEMENT_MODEL,
  StockLevelSchema,
  StockMovementSchema,
} from './infrastructure/mongoose/schemas';
import { InventoryController } from './presentation/inventory.controller';

/**
 * Inventory module (the keystone). Owns the immutable stock ledger + the on-hand projection and is the
 * **only** module that writes the ledger. Depends one-way on Catalog (variant existence) and Locations
 * (location existence) — no cycle. Ports bound to in-memory adapters until the database module lands;
 * Mongoose adapters wrap the ledger+projection write in a session (DATABASE §11). Exports `InventoryQuery`
 * (the read-model) for future consumers.
 */
@Module({
  imports: [
    CatalogModule,
    LocationsModule,
    SettingsModule,
    ...mongoFeature([
      { name: MOVEMENT_MODEL, schema: StockMovementSchema },
      { name: LEVEL_MODEL, schema: StockLevelSchema },
    ]),
  ],
  controllers: [InventoryController],
  providers: [
    repositoryProvider(
      STOCK_MOVEMENT_REPOSITORY,
      InMemoryStockMovementRepository,
      MongoStockMovementRepository,
    ),
    repositoryProvider(STOCK_LEVEL_REPOSITORY, InMemoryStockLevelRepository, MongoStockLevelRepository),
    isMongo()
      ? { provide: LEDGER_WRITER, useClass: MongoLedgerWriter }
      : {
          provide: LEDGER_WRITER,
          inject: [STOCK_MOVEMENT_REPOSITORY, STOCK_LEVEL_REPOSITORY],
          useFactory: (movements: StockMovementRepository, levels: StockLevelRepository): LedgerWriter =>
            new InMemoryLedgerWriter(movements, levels),
        },
    {
      provide: INVENTORY_POLICY,
      inject: [SettingsQuery],
      useFactory: (settings: SettingsQuery): InventoryPolicyPort => new SettingsInventoryPolicy(settings),
    },
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
        LEDGER_WRITER,
      ],
      useFactory: (
        movements: StockMovementRepository,
        levels: StockLevelRepository,
        references: InventoryReferencePort,
        policy: InventoryPolicyPort,
        ids: InventoryIdGenerator,
        clock: InventoryClock,
        events: InventoryEventPublisher,
        ledger: LedgerWriter,
      ): InventoryService =>
        new InventoryService(movements, levels, references, policy, ids, clock, events, ledger),
    },
    InventoryQuery,
  ],
  exports: [InventoryQuery, InventoryService],
})
export class InventoryModule {}
