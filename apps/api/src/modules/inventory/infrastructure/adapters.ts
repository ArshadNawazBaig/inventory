import { Injectable } from '@nestjs/common';
import { rootLogger } from '../../../common/logging/logger';
import { CatalogQuery } from '../../catalog/application/catalog-query.service';
import { LocationQuery } from '../../locations/application/location-query.service';
import type { InventoryEvent } from '../domain/entities';
import type { InventoryEventPublisher, InventoryPolicyPort, InventoryReferencePort } from '../application/ports';

/**
 * Real reference checks — a movement must target a live variant (Catalog) and a live location (Locations),
 * both in the tenant. Delegates to those modules' public query surfaces (one-way deps; no cycle).
 */
@Injectable()
export class CatalogLocationReference implements InventoryReferencePort {
  constructor(
    private readonly catalog: CatalogQuery,
    private readonly locations: LocationQuery,
  ) {}

  variantExists(organizationId: string, variantId: string): Promise<boolean> {
    return this.catalog.variantExists(organizationId, variantId);
  }

  locationExists(organizationId: string, locationId: string): Promise<boolean> {
    return this.locations.locationExists(organizationId, locationId);
  }
}

/**
 * Default stock policy — disallows negative on-hand. Backed by the tenant's `settings.allowNegativeStock`
 * once the Settings module lands; until then it fails closed (no negative stock).
 */
@Injectable()
export class DefaultInventoryPolicy implements InventoryPolicyPort {
  allowNegativeStock(_organizationId: string): Promise<boolean> {
    return Promise.resolve(false);
  }
}

/** Logs inventory domain events via Pino until the event bus / outbox (queues phase) lands. */
@Injectable()
export class LoggingInventoryEventPublisher implements InventoryEventPublisher {
  publish(event: InventoryEvent): void {
    rootLogger.info(
      {
        action: event.action,
        organizationId: event.organizationId,
        variantId: event.variantId,
        locationId: event.locationId,
        movementId: event.movementId,
        type: event.type,
        delta: event.delta,
      },
      'inventory:event',
    );
  }
}
