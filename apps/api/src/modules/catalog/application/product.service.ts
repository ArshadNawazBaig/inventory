import type {
  CreateProductRequest,
  CreateVariantInput,
  CreateVariantRequest,
  ListProductsQuery,
  UpdateProductRequest,
  UpdateVariantRequest,
} from '@stockflow/types';
import type { ActorContext } from '../../../common/auth/actor-context';
import {
  DuplicateSkuError,
  InvalidReferenceError,
  LastVariantError,
  ProductNotFoundError,
  VariantInUseError,
  VariantNotFoundError,
} from '../domain/catalog.errors';
import type {
  CatalogEventName,
  ProductEntity,
  ProductListItem,
  ProductWithVariants,
  VariantEntity,
} from '../domain/entities';
import { normalizeSku } from '../domain/sku';
import type {
  CatalogReferencePort,
  Clock,
  EventPublisher,
  IdGenerator,
  InventoryQueryPort,
  ProductRepository,
  VariantRepository,
} from './ports';

/**
 * Product module use cases (application layer, framework-free). Enforces every
 * invariant before persisting: SKU uniqueness, valid references, "≥1 variant",
 * and delete/archive guards against live stock. See docs/modules/product.md.
 */
export class ProductService {
  constructor(
    private readonly products: ProductRepository,
    private readonly variants: VariantRepository,
    private readonly inventory: InventoryQueryPort,
    private readonly references: CatalogReferencePort,
    private readonly events: EventPublisher,
    private readonly ids: IdGenerator,
    private readonly clock: Clock,
  ) {}

  async createProduct(ctx: ActorContext, input: CreateProductRequest): Promise<ProductWithVariants> {
    const org = ctx.organizationId;
    await this.assertReferences(org, {
      categoryId: input.categoryId,
      brandId: input.brandId,
      baseUnitId: input.baseUnitId,
      unitIds: input.variants.map((v) => v.unitId),
    });

    const skus = input.variants.map((v) => normalizeSku(v.sku));
    const duplicateInBody = skus.find((sku, index) => skus.indexOf(sku) !== index);
    if (duplicateInBody !== undefined) {
      throw new DuplicateSkuError(duplicateInBody);
    }
    for (const sku of skus) {
      if (await this.variants.findLiveBySku(org, sku)) {
        throw new DuplicateSkuError(sku);
      }
    }

    const now = this.clock.now();
    const product = await this.products.insert({
      id: this.ids.generate(),
      organizationId: org,
      name: input.name,
      description: input.description ?? null,
      categoryId: input.categoryId ?? null,
      brandId: input.brandId ?? null,
      baseUnitId: input.baseUnitId,
      attributes: input.attributes ?? {},
      imageFileIds: input.imageFileIds ?? [],
      status: 'draft',
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
      createdBy: ctx.actorId,
      updatedBy: ctx.actorId,
    });

    const variants = await this.variants.insertMany(
      input.variants.map((variant) => this.buildVariant(ctx, product.id, variant, now)),
    );

    this.publish('ProductCreated', org, { productId: product.id });
    for (const variant of variants) {
      this.publish('VariantCreated', org, {
        productId: product.id,
        variantId: variant.id,
        sku: variant.sku,
      });
    }
    return { ...product, variants };
  }

  async getProduct(ctx: ActorContext, id: string): Promise<ProductWithVariants> {
    const product = await this.products.findById(ctx.organizationId, id);
    if (!product) {
      throw new ProductNotFoundError(id);
    }
    const variants = await this.variants.findByProduct(ctx.organizationId, id);
    return { ...product, variants };
  }

  async listProducts(
    ctx: ActorContext,
    query: ListProductsQuery,
  ): Promise<{ items: ProductListItem[]; total: number; page: number; limit: number }> {
    const { items, total } = await this.products.list(ctx.organizationId, query);
    const enriched = await Promise.all(
      items.map(async (product): Promise<ProductListItem> => {
        const variantCount = await this.variants.countLiveByProduct(ctx.organizationId, product.id);
        return { ...product, variantCount };
      }),
    );
    return { items: enriched, total, page: query.page, limit: query.limit };
  }

  async updateProduct(
    ctx: ActorContext,
    id: string,
    input: UpdateProductRequest,
  ): Promise<ProductEntity> {
    const org = ctx.organizationId;
    const existing = await this.products.findById(org, id);
    if (!existing) {
      throw new ProductNotFoundError(id);
    }
    await this.assertReferences(org, {
      categoryId: input.categoryId ?? undefined,
      brandId: input.brandId ?? undefined,
      baseUnitId: input.baseUnitId,
    });

    const patch: Partial<ProductEntity> = { updatedAt: this.clock.now(), updatedBy: ctx.actorId };
    if (input.name !== undefined) patch.name = input.name;
    if (input.description !== undefined) patch.description = input.description;
    if (input.categoryId !== undefined) patch.categoryId = input.categoryId;
    if (input.brandId !== undefined) patch.brandId = input.brandId;
    if (input.baseUnitId !== undefined) patch.baseUnitId = input.baseUnitId;
    if (input.attributes !== undefined) patch.attributes = input.attributes;
    if (input.imageFileIds !== undefined) patch.imageFileIds = input.imageFileIds;

    const updated = await this.products.update(org, id, patch);
    if (!updated) {
      throw new ProductNotFoundError(id);
    }
    this.publish('ProductUpdated', org, { productId: id });
    return updated;
  }

  async archiveProduct(ctx: ActorContext, id: string): Promise<ProductEntity> {
    const updated = await this.transition(ctx, id, 'archived');
    this.publish('ProductArchived', ctx.organizationId, { productId: id });
    return updated;
  }

  async restoreProduct(ctx: ActorContext, id: string): Promise<ProductEntity> {
    const org = ctx.organizationId;
    const existing = await this.products.findById(org, id, { withDeleted: true });
    if (!existing) {
      throw new ProductNotFoundError(id);
    }
    const updated = await this.products.update(org, id, {
      status: 'active',
      deletedAt: null,
      updatedAt: this.clock.now(),
      updatedBy: ctx.actorId,
    });
    if (!updated) {
      throw new ProductNotFoundError(id);
    }
    this.publish('ProductRestored', org, { productId: id });
    return updated;
  }

  async deleteProduct(ctx: ActorContext, id: string): Promise<void> {
    const org = ctx.organizationId;
    const product = await this.products.findById(org, id);
    if (!product) {
      throw new ProductNotFoundError(id);
    }
    const variants = await this.variants.findByProduct(org, id);
    for (const variant of variants) {
      await this.assertVariantNotInUse(org, variant);
    }
    const now = this.clock.now();
    await this.products.update(org, id, { deletedAt: now, updatedAt: now, updatedBy: ctx.actorId });
    for (const variant of variants) {
      await this.variants.update(org, variant.id, {
        deletedAt: now,
        updatedAt: now,
        updatedBy: ctx.actorId,
      });
    }
    this.publish('ProductDeleted', org, { productId: id });
  }

  async addVariant(
    ctx: ActorContext,
    productId: string,
    input: CreateVariantRequest,
  ): Promise<VariantEntity> {
    const org = ctx.organizationId;
    const product = await this.products.findById(org, productId);
    if (!product) {
      throw new ProductNotFoundError(productId);
    }
    await this.assertReferences(org, { unitIds: [input.unitId] });
    const sku = normalizeSku(input.sku);
    if (await this.variants.findLiveBySku(org, sku)) {
      throw new DuplicateSkuError(sku);
    }
    const variant = await this.variants.insert(
      this.buildVariant(ctx, productId, input, this.clock.now()),
    );
    this.publish('VariantCreated', org, { productId, variantId: variant.id, sku: variant.sku });
    return variant;
  }

  async getVariant(
    ctx: ActorContext,
    productId: string,
    variantId: string,
  ): Promise<VariantEntity> {
    const variant = await this.variants.findById(ctx.organizationId, variantId);
    if (!variant || variant.productId !== productId) {
      throw new VariantNotFoundError(variantId);
    }
    return variant;
  }

  async listVariants(ctx: ActorContext, productId: string): Promise<VariantEntity[]> {
    const product = await this.products.findById(ctx.organizationId, productId);
    if (!product) {
      throw new ProductNotFoundError(productId);
    }
    return this.variants.findByProduct(ctx.organizationId, productId);
  }

  async updateVariant(
    ctx: ActorContext,
    productId: string,
    variantId: string,
    input: UpdateVariantRequest,
  ): Promise<VariantEntity> {
    const org = ctx.organizationId;
    const variant = await this.variants.findById(org, variantId);
    if (!variant || variant.productId !== productId) {
      throw new VariantNotFoundError(variantId);
    }
    if (input.unitId) {
      await this.assertReferences(org, { unitIds: [input.unitId] });
    }

    const patch: Partial<VariantEntity> = { updatedAt: this.clock.now(), updatedBy: ctx.actorId };
    if (input.sku !== undefined) {
      const sku = normalizeSku(input.sku);
      if (sku !== variant.sku) {
        const clash = await this.variants.findLiveBySku(org, sku);
        if (clash && clash.id !== variantId) {
          throw new DuplicateSkuError(sku);
        }
      }
      patch.sku = sku;
    }
    if (input.barcode !== undefined) patch.barcode = input.barcode;
    if (input.attributes !== undefined) patch.attributes = input.attributes;
    if (input.unitId !== undefined) patch.unitId = input.unitId;
    if (input.reorderPoint !== undefined) patch.reorderPoint = input.reorderPoint;
    if (input.reorderQty !== undefined) patch.reorderQty = input.reorderQty;
    if (input.defaultPriceMinor !== undefined) patch.defaultPriceMinor = input.defaultPriceMinor;
    if (input.currency !== undefined) patch.currency = input.currency;

    const updated = await this.variants.update(org, variantId, patch);
    if (!updated) {
      throw new VariantNotFoundError(variantId);
    }
    this.publish('VariantUpdated', org, { productId, variantId });
    return updated;
  }

  async deleteVariant(ctx: ActorContext, productId: string, variantId: string): Promise<void> {
    const org = ctx.organizationId;
    const variant = await this.variants.findById(org, variantId);
    if (!variant || variant.productId !== productId) {
      throw new VariantNotFoundError(variantId);
    }
    if ((await this.variants.countLiveByProduct(org, productId)) <= 1) {
      throw new LastVariantError(productId);
    }
    await this.assertVariantNotInUse(org, variant);
    const now = this.clock.now();
    await this.variants.update(org, variantId, {
      deletedAt: now,
      updatedAt: now,
      updatedBy: ctx.actorId,
    });
    this.publish('VariantDeleted', org, { productId, variantId });
  }

  // ─── helpers ───────────────────────────────────────────────────────────────
  private buildVariant(
    ctx: ActorContext,
    productId: string,
    input: CreateVariantInput,
    now: Date,
  ): VariantEntity {
    return {
      id: this.ids.generate(),
      organizationId: ctx.organizationId,
      productId,
      sku: normalizeSku(input.sku),
      barcode: input.barcode ?? null,
      attributes: input.attributes ?? {},
      unitId: input.unitId ?? null,
      reorderPoint: input.reorderPoint ?? 0,
      reorderQty: input.reorderQty ?? 0,
      defaultPriceMinor: input.defaultPriceMinor ?? null,
      currency: input.currency ?? null,
      status: 'active',
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
      createdBy: ctx.actorId,
      updatedBy: ctx.actorId,
    };
  }

  private async transition(
    ctx: ActorContext,
    id: string,
    status: ProductEntity['status'],
  ): Promise<ProductEntity> {
    const org = ctx.organizationId;
    const existing = await this.products.findById(org, id);
    if (!existing) {
      throw new ProductNotFoundError(id);
    }
    const updated = await this.products.update(org, id, {
      status,
      updatedAt: this.clock.now(),
      updatedBy: ctx.actorId,
    });
    if (!updated) {
      throw new ProductNotFoundError(id);
    }
    return updated;
  }

  private async assertVariantNotInUse(org: string, variant: VariantEntity): Promise<void> {
    const stock = await this.inventory.getVariantStockSummary(org, variant.id);
    if (stock.onHand > 0 || stock.reserved > 0 || stock.inTransit > 0 || stock.hasOpenOrders) {
      throw new VariantInUseError(variant.sku);
    }
  }

  private async assertReferences(
    org: string,
    refs: {
      categoryId?: string | undefined;
      brandId?: string | undefined;
      baseUnitId?: string | undefined;
      unitIds?: (string | undefined)[] | undefined;
    },
  ): Promise<void> {
    if (refs.categoryId && !(await this.references.categoryExists(org, refs.categoryId))) {
      throw new InvalidReferenceError('categoryId', refs.categoryId);
    }
    if (refs.brandId && !(await this.references.brandExists(org, refs.brandId))) {
      throw new InvalidReferenceError('brandId', refs.brandId);
    }
    if (refs.baseUnitId && !(await this.references.unitExists(org, refs.baseUnitId))) {
      throw new InvalidReferenceError('baseUnitId', refs.baseUnitId);
    }
    for (const unitId of refs.unitIds ?? []) {
      if (unitId && !(await this.references.unitExists(org, unitId))) {
        throw new InvalidReferenceError('unitId', unitId);
      }
    }
  }

  private publish(name: CatalogEventName, organizationId: string, payload: Record<string, unknown>): void {
    this.events.publish({ name, organizationId, payload });
  }
}
