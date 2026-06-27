import { Inject, Injectable } from '@nestjs/common';
import { VARIANT_REPOSITORY, type VariantRepository } from './ports';

/**
 * The public, read-only query surface other modules use to validate catalog references. The Inventory
 * module binds its reference port to this so a stock movement must target a real, live variant — the same
 * pattern Product uses with `CatalogLookupQuery` / `LocationQuery`. Existence means "live in this tenant".
 */
@Injectable()
export class CatalogQuery {
  constructor(@Inject(VARIANT_REPOSITORY) private readonly variants: VariantRepository) {}

  async variantExists(organizationId: string, variantId: string): Promise<boolean> {
    return Boolean(await this.variants.findById(organizationId, variantId));
  }
}
