import { randomUUID } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import { rootLogger } from '../../../common/logging/logger';
import type {
  CatalogReferencePort,
  Clock,
  EventPublisher,
  IdGenerator,
  InventoryQueryPort,
} from '../application/ports';
import type { CatalogEvent, VariantStockSummary } from '../domain/entities';

/** UUID id generator (Mongo ObjectId generator replaces this with the DB module). */
@Injectable()
export class UuidIdGenerator implements IdGenerator {
  generate(): string {
    return randomUUID();
  }
}

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
 * Stub reference checks — accepts all references until the Category/Brand/Unit
 * modules exist (no taxonomy to validate against yet). Replaced per those modules.
 */
@Injectable()
export class StubCatalogReference implements CatalogReferencePort {
  categoryExists(_organizationId: string, _id: string): Promise<boolean> {
    return Promise.resolve(true);
  }
  brandExists(_organizationId: string, _id: string): Promise<boolean> {
    return Promise.resolve(true);
  }
  unitExists(_organizationId: string, _id: string): Promise<boolean> {
    return Promise.resolve(true);
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
