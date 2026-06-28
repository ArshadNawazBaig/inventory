import { Module } from '@nestjs/common';
import {
  ObjectIdGenerator,
  SystemClock,
  type ResourceClock,
  type ResourceIdGenerator,
} from '../../common/resource';
import { CountersModule, mongoFeature, repositoryProvider } from '../../common/persistence';
import { CatalogModule } from '../catalog/catalog.module';
import { CatalogQuery } from '../catalog/application/catalog-query.service';
import { InventoryModule } from '../inventory/inventory.module';
import { LocationsModule } from '../locations/locations.module';
import { LocationQuery } from '../locations/application/location-query.service';
import {
  TRANSFERS_CATALOG,
  TRANSFERS_CLOCK,
  TRANSFERS_ID_GENERATOR,
  TRANSFERS_LOCATION,
  TRANSFERS_STOCK_MOVER,
  TRANSFER_REPOSITORY,
  type CatalogRef,
  type LocationRef,
  type StockMover,
  type TransferRepository,
} from './application/ports';
import { TransfersService } from './application/transfers.service';
import { TransfersQuery } from './application/transfers-query.service';
import { InMemoryTransferRepository } from './infrastructure/in-memory.repository';
import { MongoTransferRepository } from './infrastructure/mongoose/mongo.repository';
import { TRANSFER_MODEL, TransferSchema } from './infrastructure/mongoose/schemas';
import { InventoryStockMover } from './infrastructure/adapters';
import { TransferController } from './presentation/transfer.controller';

/**
 * Transfers module (inter-location stock moves). Depends one-way on Catalog (variant snapshots), Locations
 * (source/destination) and Inventory (posting the two `transfer_out`/`transfer_in` legs) — no cycles. Ports
 * bound to in-memory + delegating adapters until the database module lands.
 */
@Module({
  imports: [
    CatalogModule,
    LocationsModule,
    InventoryModule,
    CountersModule,
    ...mongoFeature([{ name: TRANSFER_MODEL, schema: TransferSchema }]),
  ],
  controllers: [TransferController],
  providers: [
    repositoryProvider(TRANSFER_REPOSITORY, InMemoryTransferRepository, MongoTransferRepository),
    { provide: TRANSFERS_STOCK_MOVER, useClass: InventoryStockMover },
    { provide: TRANSFERS_ID_GENERATOR, useValue: new ObjectIdGenerator() },
    { provide: TRANSFERS_CLOCK, useValue: new SystemClock() },
    {
      provide: TRANSFERS_CATALOG,
      inject: [CatalogQuery],
      useFactory: (catalog: CatalogQuery): CatalogRef => catalog,
    },
    {
      provide: TRANSFERS_LOCATION,
      inject: [LocationQuery],
      useFactory: (locations: LocationQuery): LocationRef => locations,
    },
    {
      provide: TransfersService,
      inject: [
        TRANSFER_REPOSITORY,
        TRANSFERS_CATALOG,
        TRANSFERS_LOCATION,
        TRANSFERS_STOCK_MOVER,
        TRANSFERS_ID_GENERATOR,
        TRANSFERS_CLOCK,
      ],
      useFactory: (
        repo: TransferRepository,
        catalog: CatalogRef,
        locations: LocationRef,
        mover: StockMover,
        ids: ResourceIdGenerator,
        clock: ResourceClock,
      ): TransfersService => new TransfersService(repo, catalog, locations, mover, ids, clock),
    },
    TransfersQuery,
  ],
  exports: [TransfersQuery],
})
export class TransfersModule {}
