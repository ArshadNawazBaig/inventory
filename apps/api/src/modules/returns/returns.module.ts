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
import { PartiesModule } from '../parties/parties.module';
import { PartyQuery } from '../parties/application/party-query.service';
import {
  RETURNS_CATALOG,
  RETURNS_CLOCK,
  RETURNS_ID_GENERATOR,
  RETURNS_LOCATION,
  RETURNS_PARTY,
  RETURNS_POSTER,
  RETURN_REPOSITORY,
  type CatalogRef,
  type LocationRef,
  type PartyRef,
  type ReturnPoster,
  type ReturnRepository,
} from './application/ports';
import { ReturnsService } from './application/returns.service';
import { InMemoryReturnRepository } from './infrastructure/in-memory.repository';
import { MongoReturnRepository } from './infrastructure/mongoose/mongo.repository';
import { RETURN_MODEL, ReturnSchema } from './infrastructure/mongoose/schemas';
import { InventoryReturnPoster } from './infrastructure/adapters';
import { ReturnController } from './presentation/return.controller';

/**
 * Returns module (customer + supplier returns). Depends one-way on Catalog (variant snapshots), Parties
 * (customer/supplier), Locations (where stock moves) and Inventory (posting `return_in`/`return_out` movements)
 * — no cycles. Ports bound to in-memory + delegating adapters until the database module lands.
 */
@Module({
  imports: [
    CatalogModule,
    PartiesModule,
    LocationsModule,
    InventoryModule,
    CountersModule,
    ...mongoFeature([{ name: RETURN_MODEL, schema: ReturnSchema }]),
  ],
  controllers: [ReturnController],
  providers: [
    repositoryProvider(RETURN_REPOSITORY, InMemoryReturnRepository, MongoReturnRepository),
    { provide: RETURNS_POSTER, useClass: InventoryReturnPoster },
    { provide: RETURNS_ID_GENERATOR, useValue: new ObjectIdGenerator() },
    { provide: RETURNS_CLOCK, useValue: new SystemClock() },
    {
      provide: RETURNS_CATALOG,
      inject: [CatalogQuery],
      useFactory: (catalog: CatalogQuery): CatalogRef => catalog,
    },
    {
      provide: RETURNS_PARTY,
      inject: [PartyQuery],
      useFactory: (parties: PartyQuery): PartyRef => parties,
    },
    {
      provide: RETURNS_LOCATION,
      inject: [LocationQuery],
      useFactory: (locations: LocationQuery): LocationRef => locations,
    },
    {
      provide: ReturnsService,
      inject: [
        RETURN_REPOSITORY,
        RETURNS_CATALOG,
        RETURNS_PARTY,
        RETURNS_LOCATION,
        RETURNS_POSTER,
        RETURNS_ID_GENERATOR,
        RETURNS_CLOCK,
      ],
      useFactory: (
        repo: ReturnRepository,
        catalog: CatalogRef,
        parties: PartyRef,
        locations: LocationRef,
        poster: ReturnPoster,
        ids: ResourceIdGenerator,
        clock: ResourceClock,
      ): ReturnsService => new ReturnsService(repo, catalog, parties, locations, poster, ids, clock),
    },
  ],
})
export class ReturnsModule {}
