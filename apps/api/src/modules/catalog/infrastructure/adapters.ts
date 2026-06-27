import { Injectable } from '@nestjs/common';
import { rootLogger } from '../../../common/logging/logger';
import { CatalogLookupQuery } from '../../catalog-lookups/application/catalog-lookup-query.service';
import type {
  CatalogReferencePort,
  Clock,
  EventPublisher,
  InventoryQueryPort,
} from '../application/ports';
import type { CatalogEvent, VariantStockSummary } from '../domain/entities';

@Injectable()
export class SystemClock implements Clock {
  now(): Date {
    return new Date();
  }
}

/**
 * Stub Inventory window — reports zero stock until the Inventory module exists, so
 * delete guards pass for a fresh catalog. Replaced by the real InventoryQueryPort.
 */
@Injectable()
export class StubInventoryQuery implements InventoryQueryPort {
  getVariantStockSummary(_organizationId: string, _variantId: string): Promise<VariantStockSummary> {
    return Promise.resolve({ onHand: 0, reserved: 0, inTransit: 0, hasOpenOrders: false });
  }
}

/**
 * Real reference checks — delegates to the Catalog Lookups module's public query surface so a
 * product's category/brand/unit must exist (live, same tenant). Replaces the former stub.
 */
@Injectable()
export class LookupCatalogReference implements CatalogReferencePort {
  constructor(private readonly lookups: CatalogLookupQuery) {}

  categoryExists(organizationId: string, id: string): Promise<boolean> {
    return this.lookups.categoryExists(organizationId, id);
  }
  brandExists(organizationId: string, id: string): Promise<boolean> {
    return this.lookups.brandExists(organizationId, id);
  }
  unitExists(organizationId: string, id: string): Promise<boolean> {
    return this.lookups.unitExists(organizationId, id);
  }
}

/** Logs domain events via Pino until the event bus / outbox (queues phase) lands. */
@Injectable()
export class LoggingEventPublisher implements EventPublisher {
  publish(event: CatalogEvent): void {
    rootLogger.info(
      { event: event.name, organizationId: event.organizationId, ...event.payload },
      'catalog:event',
    );
  }
}
