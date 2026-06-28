import type { StockLevelListQuery, StockMovementListQuery } from '@stockflow/types';
import type { InventoryEvent, StockLevelEntity, StockMovementEntity } from '../domain/entities';

/**
 * Append-only ledger store. Movements are never updated or deleted. `findByOpKey` powers idempotency;
 * `listByVariantLocation` powers reconciliation (`onHand == Σ delta`).
 */
export interface StockMovementRepository {
  insert(movement: StockMovementEntity): Promise<StockMovementEntity>;
  findByOpKey(organizationId: string, opKey: string): Promise<StockMovementEntity | null>;
  list(
    organizationId: string,
    query: StockMovementListQuery,
  ): Promise<{ items: StockMovementEntity[]; total: number }>;
  listByVariantLocation(
    organizationId: string,
    variantId: string,
    locationId: string,
  ): Promise<StockMovementEntity[]>;
}

/** Projection store — one row per (variant × location). Upserted in the same unit of work as the ledger. */
export interface StockLevelRepository {
  findByCell(
    organizationId: string,
    variantId: string,
    locationId: string,
  ): Promise<StockLevelEntity | null>;
  upsert(level: StockLevelEntity): Promise<StockLevelEntity>;
  list(
    organizationId: string,
    query: StockLevelListQuery,
  ): Promise<{ items: StockLevelEntity[]; total: number }>;
  listByVariant(organizationId: string, variantId: string): Promise<StockLevelEntity[]>;
  /** Every projection row for the tenant — the basis for cross-cutting reports (valuation, low-stock). */
  listAll(organizationId: string): Promise<StockLevelEntity[]>;
}

/**
 * The atomic ledger write — appends the immutable movement AND upserts its projection as **one unit of work**
 * (the golden rule: stock changes go through the ledger inside a transaction). The in-memory writer delegates
 * to the two repos sequentially; the Mongo writer wraps both in a session transaction (DATABASE §11).
 */
export interface LedgerWriter {
  append(
    movement: StockMovementEntity,
    level: StockLevelEntity,
  ): Promise<{ movement: StockMovementEntity; level: StockLevelEntity }>;
}

/** Existence checks for the references a movement points at (bound to Catalog + Locations queries). */
export interface InventoryReferencePort {
  variantExists(organizationId: string, variantId: string): Promise<boolean>;
  locationExists(organizationId: string, locationId: string): Promise<boolean>;
}

/** Tenant stock policy (backed by the Settings module later; stub disallows negative on-hand for now). */
export interface InventoryPolicyPort {
  allowNegativeStock(organizationId: string): Promise<boolean>;
}

export interface InventoryIdGenerator {
  generate(): string;
}

export interface InventoryClock {
  now(): Date;
}

export interface InventoryEventPublisher {
  publish(event: InventoryEvent): void;
}

// ─── DI tokens (framework-agnostic symbols; wired in inventory.module.ts) ────────
export const STOCK_MOVEMENT_REPOSITORY = Symbol('StockMovementRepository');
export const STOCK_LEVEL_REPOSITORY = Symbol('StockLevelRepository');
export const LEDGER_WRITER = Symbol('LedgerWriter');
export const INVENTORY_REFERENCE = Symbol('InventoryReferencePort');
export const INVENTORY_POLICY = Symbol('InventoryPolicyPort');
export const INVENTORY_ID_GENERATOR = Symbol('InventoryIdGenerator');
export const INVENTORY_CLOCK = Symbol('InventoryClock');
export const INVENTORY_EVENT_PUBLISHER = Symbol('InventoryEventPublisher');
