import { Module } from '@nestjs/common';
import { ObjectIdGenerator } from '../../common/resource';
import {
  CATALOG_REFERENCE,
  type CatalogReferencePort,
  CLOCK,
  type Clock,
  EVENT_PUBLISHER,
  type EventPublisher,
  ID_GENERATOR,
  type IdGenerator,
  INVENTORY_QUERY,
  type InventoryQueryPort,
  PRODUCT_REPOSITORY,
  type ProductRepository,
  VARIANT_REPOSITORY,
  type VariantRepository,
} from './application/ports';
import { CatalogLookupsModule } from '../catalog-lookups/catalog-lookups.module';
import { CatalogLookupQuery } from '../catalog-lookups/application/catalog-lookup-query.service';
import { CatalogQuery } from './application/catalog-query.service';
import { ProductService } from './application/product.service';
import {
  LoggingEventPublisher,
  LookupCatalogReference,
  StubInventoryQuery,
  SystemClock,
} from './infrastructure/adapters';
import {
  InMemoryProductRepository,
  InMemoryVariantRepository,
} from './infrastructure/in-memory.repositories';
import { ProductController } from './presentation/product.controller';

/**
 * Catalog (Product) module. Ports are bound to in-memory + stub adapters until the
 * database and Inventory modules land; swapping to Mongoose/real adapters is a
 * one-line change here — the application layer is untouched (dependency inversion).
 */
@Module({
  imports: [CatalogLookupsModule],
  controllers: [ProductController],
  providers: [
    { provide: PRODUCT_REPOSITORY, useClass: InMemoryProductRepository },
    { provide: VARIANT_REPOSITORY, useClass: InMemoryVariantRepository },
    { provide: INVENTORY_QUERY, useClass: StubInventoryQuery },
    {
      provide: CATALOG_REFERENCE,
      inject: [CatalogLookupQuery],
      useFactory: (lookups: CatalogLookupQuery): CatalogReferencePort =>
        new LookupCatalogReference(lookups),
    },
    { provide: EVENT_PUBLISHER, useClass: LoggingEventPublisher },
    { provide: ID_GENERATOR, useValue: new ObjectIdGenerator() },
    { provide: CLOCK, useClass: SystemClock },
    {
      provide: ProductService,
      inject: [
        PRODUCT_REPOSITORY,
        VARIANT_REPOSITORY,
        INVENTORY_QUERY,
        CATALOG_REFERENCE,
        EVENT_PUBLISHER,
        ID_GENERATOR,
        CLOCK,
      ],
      useFactory: (
        products: ProductRepository,
        variants: VariantRepository,
        inventory: InventoryQueryPort,
        references: CatalogReferencePort,
        events: EventPublisher,
        ids: IdGenerator,
        clock: Clock,
      ): ProductService =>
        new ProductService(products, variants, inventory, references, events, ids, clock),
    },
    CatalogQuery,
  ],
  exports: [CatalogQuery],
})
export class CatalogModule {}
