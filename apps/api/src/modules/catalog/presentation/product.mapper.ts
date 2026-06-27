import type { ProductResponse, VariantResponse } from '@stockflow/types';
import type { ProductEntity, VariantEntity } from '../domain/entities';

/** Explicit domain → Response DTO mappers (no Mongoose/entity leakage to clients). */
export function toVariantResponse(variant: VariantEntity): VariantResponse {
  return {
    id: variant.id,
    productId: variant.productId,
    sku: variant.sku,
    barcode: variant.barcode,
    attributes: variant.attributes,
    unitId: variant.unitId,
    reorderPoint: variant.reorderPoint,
    reorderQty: variant.reorderQty,
    defaultPriceMinor: variant.defaultPriceMinor,
    currency: variant.currency,
    status: variant.status,
    createdAt: variant.createdAt.toISOString(),
    updatedAt: variant.updatedAt.toISOString(),
  };
}

export function toProductResponse(
  product: ProductEntity,
  opts: { variants?: VariantEntity[]; variantCount?: number } = {},
): ProductResponse {
  const variantCount = opts.variantCount ?? opts.variants?.length ?? 0;
  const base: ProductResponse = {
    id: product.id,
    name: product.name,
    description: product.description,
    categoryId: product.categoryId,
    brandId: product.brandId,
    baseUnitId: product.baseUnitId,
    attributes: product.attributes,
    imageFileIds: product.imageFileIds,
    status: product.status,
    hasVariants: variantCount > 0,
    variantCount,
    createdAt: product.createdAt.toISOString(),
    updatedAt: product.updatedAt.toISOString(),
  };
  if (opts.variants) {
    return { ...base, variants: opts.variants.map(toVariantResponse) };
  }
  return base;
}
