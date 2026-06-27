import { Inject, Injectable } from '@nestjs/common';
import {
  BRAND_REPOSITORY,
  CATEGORY_REPOSITORY,
  UNIT_REPOSITORY,
  type BrandRepository,
  type CategoryRepository,
  type UnitRepository,
} from './ports';

/**
 * The public, read-only query surface other modules use to validate catalog references. The Product
 * module binds its `CatalogReferencePort` to an adapter delegating here — replacing `StubCatalogReference`.
 * Existence means "live in this tenant" (soft-deleted lookups don't exist; archived ones still do).
 */
@Injectable()
export class CatalogLookupQuery {
  constructor(
    @Inject(CATEGORY_REPOSITORY) private readonly categories: CategoryRepository,
    @Inject(BRAND_REPOSITORY) private readonly brands: BrandRepository,
    @Inject(UNIT_REPOSITORY) private readonly units: UnitRepository,
  ) {}

  async categoryExists(organizationId: string, id: string): Promise<boolean> {
    return Boolean(await this.categories.findById(organizationId, id));
  }

  async brandExists(organizationId: string, id: string): Promise<boolean> {
    return Boolean(await this.brands.findById(organizationId, id));
  }

  async unitExists(organizationId: string, id: string): Promise<boolean> {
    return Boolean(await this.units.findById(organizationId, id));
  }
}
