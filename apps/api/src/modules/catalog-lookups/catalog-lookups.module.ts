import { Module } from '@nestjs/common';
import type {
  ResourceClock,
  ResourceEventPublisher,
  ResourceIdGenerator,
} from '../../common/resource';
import {
  BRAND_REPOSITORY,
  type BrandRepository,
  CATEGORY_REPOSITORY,
  type CategoryRepository,
  LOOKUP_CLOCK,
  LOOKUP_EVENT_PUBLISHER,
  LOOKUP_ID_GENERATOR,
  UNIT_REPOSITORY,
  type UnitRepository,
} from './application/ports';
import { BrandService, CategoryService, UnitService } from './application/lookup.service';
import { CatalogLookupQuery } from './application/catalog-lookup-query.service';
import {
  InMemoryBrandRepository,
  InMemoryCategoryRepository,
  InMemoryUnitRepository,
} from './infrastructure/in-memory.repositories';
import {
  LoggingLookupEventPublisher,
  ObjectIdGenerator,
  SystemClock,
} from './infrastructure/adapters';
import {
  BrandController,
  CategoryController,
  UnitController,
} from './presentation/lookups.controllers';

/**
 * Catalog Lookups module (Categories · Brands · Units). Built on the shared `common/resource` base; ports
 * are bound to in-memory + stub adapters until the database module lands. Exports `CatalogLookupQuery` so
 * the Product module can validate references against real data.
 */
@Module({
  controllers: [CategoryController, BrandController, UnitController],
  providers: [
    { provide: CATEGORY_REPOSITORY, useClass: InMemoryCategoryRepository },
    { provide: BRAND_REPOSITORY, useClass: InMemoryBrandRepository },
    { provide: UNIT_REPOSITORY, useClass: InMemoryUnitRepository },
    { provide: LOOKUP_ID_GENERATOR, useClass: ObjectIdGenerator },
    { provide: LOOKUP_CLOCK, useClass: SystemClock },
    { provide: LOOKUP_EVENT_PUBLISHER, useClass: LoggingLookupEventPublisher },
    {
      provide: CategoryService,
      inject: [CATEGORY_REPOSITORY, LOOKUP_ID_GENERATOR, LOOKUP_CLOCK, LOOKUP_EVENT_PUBLISHER],
      useFactory: (
        repo: CategoryRepository,
        ids: ResourceIdGenerator,
        clock: ResourceClock,
        events: ResourceEventPublisher,
      ): CategoryService => new CategoryService(repo, ids, clock, events),
    },
    {
      provide: BrandService,
      inject: [BRAND_REPOSITORY, LOOKUP_ID_GENERATOR, LOOKUP_CLOCK, LOOKUP_EVENT_PUBLISHER],
      useFactory: (
        repo: BrandRepository,
        ids: ResourceIdGenerator,
        clock: ResourceClock,
        events: ResourceEventPublisher,
      ): BrandService => new BrandService(repo, ids, clock, events),
    },
    {
      provide: UnitService,
      inject: [UNIT_REPOSITORY, LOOKUP_ID_GENERATOR, LOOKUP_CLOCK, LOOKUP_EVENT_PUBLISHER],
      useFactory: (
        repo: UnitRepository,
        ids: ResourceIdGenerator,
        clock: ResourceClock,
        events: ResourceEventPublisher,
      ): UnitService => new UnitService(repo, ids, clock, events),
    },
    CatalogLookupQuery,
  ],
  exports: [CatalogLookupQuery],
})
export class CatalogLookupsModule {}
