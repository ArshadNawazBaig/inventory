import { Module } from '@nestjs/common';
import { CountersModule, mongoFeature, repositoryProvider } from '../../common/persistence';
import { ObjectIdGenerator, SystemClock } from '../../common/resource';
import { InventoryModule } from '../inventory/inventory.module';
import { InventoryService } from '../inventory/application/inventory.service';
import { InventoryQuery } from '../inventory/application/inventory-query.service';
import { PosService } from './application/pos.service';
import {
  POS_CLOCK,
  POS_ID_GENERATOR,
  POS_INVENTORY,
  POS_SALE_REPOSITORY,
  POS_STOCK_POSTER,
} from './application/ports';
import { InventoryAvailabilityRef, InventorySalePoster } from './infrastructure/adapters';
import { InMemoryPosSaleRepository } from './infrastructure/in-memory.repository';
import { MongoPosSaleRepository } from './infrastructure/mongoose/mongo.repository';
import { POS_SALE_MODEL, PosSaleSchema } from './infrastructure/mongoose/schemas';
import { PosController } from './presentation/pos.controller';

/**
 * Point-of-Sale module — retail selling at stores. Depends one-way on Inventory (the single ledger writer):
 * it reads availability (pre-sale validation) and posts negative-guarded `shipment` movements. Receipts run on
 * the `PERSISTENCE_DRIVER` switch (in-memory default · Mongoose `mongo`), minting `RC-` numbers from the shared
 * atomic `counters` collection. No cycles — Inventory does not know about POS.
 */
@Module({
  imports: [
    InventoryModule,
    CountersModule,
    ...mongoFeature([{ name: POS_SALE_MODEL, schema: PosSaleSchema }]),
  ],
  controllers: [PosController],
  providers: [
    repositoryProvider(POS_SALE_REPOSITORY, InMemoryPosSaleRepository, MongoPosSaleRepository),
    {
      provide: POS_STOCK_POSTER,
      inject: [InventoryService],
      useFactory: (inventory: InventoryService): InventorySalePoster => new InventorySalePoster(inventory),
    },
    {
      provide: POS_INVENTORY,
      inject: [InventoryQuery],
      useFactory: (query: InventoryQuery): InventoryAvailabilityRef => new InventoryAvailabilityRef(query),
    },
    { provide: POS_ID_GENERATOR, useValue: new ObjectIdGenerator() },
    { provide: POS_CLOCK, useValue: new SystemClock() },
    PosService,
  ],
})
export class PosModule {}
