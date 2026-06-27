import { Module } from '@nestjs/common';
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
import { ProductService } from './application/product.service';
import {
  LoggingEventPublisher,
  StubCatalogReference,
  StubInventoryQuery,
  SystemClock,
  UuidIdGenerator,
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
  controllers: [ProductController],
  providers: [
    { provide: PRODUCT_REPOSITORY, useClass: InMemoryProductRepository },
    { provide: VARIANT_REPOSITORY, useClass: InMemoryVariantRepository },
    { provide: INVENTORY_QUERY, useClass: StubInventoryQuery },
    { provide: CATALOG_REFERENCE, useClass: StubCatalogReference },
    { provide: EVENT_PUBLISHER, useClass: LoggingEventPublisher },
    { provide: ID_GENERATOR, useClass: UuidIdGenerator },
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
  ],
})
export class CatalogModule {}
