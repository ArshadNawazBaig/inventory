import { Injectable } from '@nestjs/common';
import { rootLogger } from '../../../common/logging/logger';
import { CatalogQuery } from '../../catalog/application/catalog-query.service';
import { LocationQuery } from '../../locations/application/location-query.service';
import { SettingsQuery } from '../../settings/application/settings-query.service';
import type { InventoryEvent, StockLevelEntity, StockMovementEntity } from '../domain/entities';
import type {
  InventoryEventPublisher,
  InventoryPolicyPort,
  InventoryReferencePort,
  LedgerWriter,
  StockLevelRepository,
  StockMovementRepository,
} from '../application/ports';

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
 * Tenant stock policy backed by the Settings module — reads `settings.allowNegativeStock` (defaults to
 * fail-closed when unset). Delegates to the Settings query surface (one-way dep; no cycle), so operators
 * control whether the ledger may drive on-hand below zero.
 */
@Injectable()
export class SettingsInventoryPolicy implements InventoryPolicyPort {
  constructor(private readonly settings: SettingsQuery) {}

  allowNegativeStock(organizationId: string): Promise<boolean> {
    return this.settings.allowNegativeStock(organizationId);
  }
}

/** Fail-closed fallback policy (no negative stock) — retained for tests and offline contexts. */
@Injectable()
export class DefaultInventoryPolicy implements InventoryPolicyPort {
  allowNegativeStock(_organizationId: string): Promise<boolean> {
    return Promise.resolve(false);
  }
}

/**
 * In-memory ledger writer — sequences the immutable movement insert + the projection upsert against the two
 * in-memory repos (single-threaded, so effectively atomic). The Mongoose writer replaces it with a real
 * session transaction; the application calls `append` identically either way.
 */
@Injectable()
export class InMemoryLedgerWriter implements LedgerWriter {
  constructor(
    private readonly movements: StockMovementRepository,
    private readonly levels: StockLevelRepository,
  ) {}

  async append(
    movement: StockMovementEntity,
    level: StockLevelEntity,
  ): Promise<{ movement: StockMovementEntity; level: StockLevelEntity }> {
    const insertedMovement = await this.movements.insert(movement);
    const upsertedLevel = await this.levels.upsert(level);
    return { movement: insertedMovement, level: upsertedLevel };
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
