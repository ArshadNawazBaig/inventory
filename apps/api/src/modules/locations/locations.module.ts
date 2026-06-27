import { Module } from '@nestjs/common';
import {
  LoggingResourceEventPublisher,
  ObjectIdGenerator,
  SystemClock,
  type ResourceClock,
  type ResourceEventPublisher,
  type ResourceIdGenerator,
} from '../../common/resource';
import {
  LOCATIONS_CLOCK,
  LOCATIONS_EVENT_PUBLISHER,
  LOCATIONS_ID_GENERATOR,
  LOCATION_REPOSITORY,
  WAREHOUSE_REPOSITORY,
  type LocationRepository,
  type WarehouseRepository,
} from './application/ports';
import { LocationService } from './application/location.service';
import { LocationQuery } from './application/location-query.service';
import { WarehouseService } from './application/warehouse.service';
import {
  InMemoryLocationRepository,
  InMemoryWarehouseRepository,
} from './infrastructure/in-memory.repositories';
import { LocationController, WarehouseController } from './presentation/locations.controllers';

/**
 * Locations module (Warehouses · Locations). Warehouses sit on the shared `common/resource` base;
 * Locations are a bespoke per-warehouse tree composing the same primitives. Ports are bound to in-memory
 * adapters until the database module lands. Exports `LocationQuery` so Inventory can validate that stock
 * targets a real, live location.
 */
@Module({
  controllers: [WarehouseController, LocationController],
  providers: [
    { provide: WAREHOUSE_REPOSITORY, useClass: InMemoryWarehouseRepository },
    { provide: LOCATION_REPOSITORY, useClass: InMemoryLocationRepository },
    { provide: LOCATIONS_ID_GENERATOR, useValue: new ObjectIdGenerator() },
    { provide: LOCATIONS_CLOCK, useValue: new SystemClock() },
    {
      provide: LOCATIONS_EVENT_PUBLISHER,
      useValue: new LoggingResourceEventPublisher('locations:event'),
    },
    {
      provide: WarehouseService,
      inject: [WAREHOUSE_REPOSITORY, LOCATIONS_ID_GENERATOR, LOCATIONS_CLOCK, LOCATIONS_EVENT_PUBLISHER],
      useFactory: (
        repo: WarehouseRepository,
        ids: ResourceIdGenerator,
        clock: ResourceClock,
        events: ResourceEventPublisher,
      ): WarehouseService => new WarehouseService(repo, ids, clock, events),
    },
    {
      provide: LocationService,
      inject: [
        LOCATION_REPOSITORY,
        WAREHOUSE_REPOSITORY,
        LOCATIONS_ID_GENERATOR,
        LOCATIONS_CLOCK,
        LOCATIONS_EVENT_PUBLISHER,
      ],
      useFactory: (
        repo: LocationRepository,
        warehouses: WarehouseRepository,
        ids: ResourceIdGenerator,
        clock: ResourceClock,
        events: ResourceEventPublisher,
      ): LocationService => new LocationService(repo, warehouses, ids, clock, events),
    },
    LocationQuery,
  ],
  exports: [LocationQuery],
})
export class LocationsModule {}
