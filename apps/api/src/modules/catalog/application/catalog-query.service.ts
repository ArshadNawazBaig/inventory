import { Inject, Injectable } from '@nestjs/common';
import {
  PRODUCT_REPOSITORY,
  VARIANT_REPOSITORY,
  type ProductRepository,
  type VariantRepository,
} from './ports';

/** A point-in-time snapshot of a variant for order lines (preserves historical accuracy). */
export interface VariantSnapshot {
  sku: string;
  productName: string;
  defaultPriceMinor: number | null;
  currency: string | null;
}

/** A reorder-eligible variant (reorderPoint > 0) joined with its product name — for the low-stock report. */
export interface ReorderVariant {
  variantId: string;
  sku: string;
  productName: string;
  reorderPoint: number;
  reorderQty: number;
}

/**
 * The public, read-only query surface other modules use to validate + snapshot catalog references. Inventory
 * binds its reference port to `variantExists`; Purchasing/Sales snapshot order lines via `getVariantSnapshot`
 * — the same pattern Product uses with `CatalogLookupQuery` / `LocationQuery`. Existence means "live in this
 * tenant".
 */
@Injectable()
export class CatalogQuery {
  constructor(
    @Inject(VARIANT_REPOSITORY) private readonly variants: VariantRepository,
    @Inject(PRODUCT_REPOSITORY) private readonly products: ProductRepository,
  ) {}

  async variantExists(organizationId: string, variantId: string): Promise<boolean> {
    return Boolean(await this.variants.findById(organizationId, variantId));
  }

  /** Snapshot a variant (sku + product name + default price) for an order line; null if not live. */
  async getVariantSnapshot(organizationId: string, variantId: string): Promise<VariantSnapshot | null> {
    const variant = await this.variants.findById(organizationId, variantId);
    if (!variant) return null;
    const product = await this.products.findById(organizationId, variant.productId);
    return {
      sku: variant.sku,
      productName: product?.name ?? '',
      defaultPriceMinor: variant.defaultPriceMinor,
      currency: variant.currency,
    };
  }

  /** Live variants with a positive reorder point, joined with their product name (low-stock report source). */
  async listReorderVariants(organizationId: string): Promise<ReorderVariant[]> {
    const variants = await this.variants.listAll(organizationId);
    const productNames = new Map<string, string>();
    const rows: ReorderVariant[] = [];
    for (const variant of variants) {
      if (variant.reorderPoint <= 0) continue;
      let productName = productNames.get(variant.productId);
      if (productName === undefined) {
        const product = await this.products.findById(organizationId, variant.productId);
        productName = product?.name ?? '';
        productNames.set(variant.productId, productName);
      }
      rows.push({
        variantId: variant.id,
        sku: variant.sku,
        productName,
        reorderPoint: variant.reorderPoint,
        reorderQty: variant.reorderQty,
      });
    }
    return rows;
  }
}
