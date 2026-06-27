import type { ListProductsQuery } from '@stockflow/types';
import type {
  CatalogEvent,
  ProductEntity,
  VariantEntity,
  VariantStockSummary,
} from '../domain/entities';

/** Persistence port for products. Implemented in infrastructure; tenant-scoped. */
export interface ProductRepository {
  insert(product: ProductEntity): Promise<ProductEntity>;
  findById(
    organizationId: string,
    id: string,
    options?: { withDeleted?: boolean },
  ): Promise<ProductEntity | null>;
  update(
    organizationId: string,
    id: string,
    patch: Partial<ProductEntity>,
  ): Promise<ProductEntity | null>;
  list(
    organizationId: string,
    query: ListProductsQuery,
  ): Promise<{ items: ProductEntity[]; total: number }>;
}

/** Persistence port for variants. SKU lookups consider only live (non-deleted) rows. */
export interface VariantRepository {
  insert(variant: VariantEntity): Promise<VariantEntity>;
  insertMany(variants: VariantEntity[]): Promise<VariantEntity[]>;
  findById(organizationId: string, id: string): Promise<VariantEntity | null>;
  findByProduct(organizationId: string, productId: string): Promise<VariantEntity[]>;
  findLiveBySku(organizationId: string, sku: string): Promise<VariantEntity | null>;
  /** Every live variant for the tenant — the basis for catalog-wide reports (e.g. low-stock/reorder). */
  listAll(organizationId: string): Promise<VariantEntity[]>;
  update(
    organizationId: string,
    id: string,
    patch: Partial<VariantEntity>,
  ): Promise<VariantEntity | null>;
  countLiveByProduct(organizationId: string, productId: string): Promise<number>;
}

/** Read-only window into the Inventory module (delete/archive guards). */
export interface InventoryQueryPort {
  getVariantStockSummary(organizationId: string, variantId: string): Promise<VariantStockSummary>;
}

/** Existence checks for catalog references (category/brand/unit) within the tenant. */
export interface CatalogReferencePort {
  categoryExists(organizationId: string, id: string): Promise<boolean>;
  brandExists(organizationId: string, id: string): Promise<boolean>;
  unitExists(organizationId: string, id: string): Promise<boolean>;
}

export interface EventPublisher {
  publish(event: CatalogEvent): void;
}

export interface IdGenerator {
  generate(): string;
}

export interface Clock {
  now(): Date;
}

// ─── DI tokens (framework-agnostic symbols; wired in catalog.module.ts) ───────
export const PRODUCT_REPOSITORY = Symbol('ProductRepository');
export const VARIANT_REPOSITORY = Symbol('VariantRepository');
export const INVENTORY_QUERY = Symbol('InventoryQueryPort');
export const CATALOG_REFERENCE = Symbol('CatalogReferencePort');
export const EVENT_PUBLISHER = Symbol('EventPublisher');
export const ID_GENERATOR = Symbol('IdGenerator');
export const CLOCK = Symbol('Clock');
