import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import type { Model, SortOrder } from 'mongoose';
import type { ListProductsQuery, ProductStatus } from '@stockflow/types';
import type { ProductEntity, VariantEntity } from '../../domain/entities';
import type { ProductRepository, VariantRepository } from '../../application/ports';
import {
  PRODUCT_MODEL,
  VARIANT_MODEL,
  type ProductDoc,
  type VariantDoc,
} from './schemas';

/** Escape a user string for safe use inside a `$regex` (the product search is a substring match). */
function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** The product `list` filter — equality terms + a case-insensitive name regex (mongoose accepts this shape). */
interface ProductListFilter {
  organizationId: string;
  deletedAt: null;
  status?: ProductStatus;
  categoryId?: string;
  brandId?: string;
  name?: { $regex: string; $options: string };
}

// ─── Mappers (entity ⇄ document; the only difference is id ⇄ _id) ────────────────
function toProductEntity(doc: ProductDoc): ProductEntity {
  return {
    id: doc._id,
    organizationId: doc.organizationId,
    name: doc.name,
    description: doc.description,
    categoryId: doc.categoryId,
    brandId: doc.brandId,
    baseUnitId: doc.baseUnitId,
    attributes: doc.attributes ?? {}, // Mongo omits empty Mixed objects; restore the entity invariant
    imageFileIds: doc.imageFileIds,
    status: doc.status,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
    deletedAt: doc.deletedAt,
    createdBy: doc.createdBy,
    updatedBy: doc.updatedBy,
  };
}

function toProductDoc(entity: ProductEntity): ProductDoc {
  const { id, ...rest } = entity;
  return { _id: id, ...rest };
}

function toVariantEntity(doc: VariantDoc): VariantEntity {
  return {
    id: doc._id,
    organizationId: doc.organizationId,
    productId: doc.productId,
    sku: doc.sku,
    barcode: doc.barcode,
    attributes: doc.attributes ?? {}, // Mongo omits empty Mixed objects; restore the entity invariant
    unitId: doc.unitId,
    reorderPoint: doc.reorderPoint,
    reorderQty: doc.reorderQty,
    defaultPriceMinor: doc.defaultPriceMinor,
    currency: doc.currency,
    status: doc.status,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
    deletedAt: doc.deletedAt,
    createdBy: doc.createdBy,
    updatedBy: doc.updatedBy,
  };
}

function toVariantDoc(entity: VariantEntity): VariantDoc {
  const { id, ...rest } = entity;
  return { _id: id, ...rest };
}

/**
 * Mongoose adapter for products — implements the same `ProductRepository` port as the in-memory store, so the
 * application layer is untouched. Tenant-scoped on every query; soft-delete via `deletedAt`.
 */
@Injectable()
export class MongoProductRepository implements ProductRepository {
  constructor(@InjectModel(PRODUCT_MODEL) private readonly model: Model<ProductDoc>) {}

  async insert(product: ProductEntity): Promise<ProductEntity> {
    await this.model.create(toProductDoc(product));
    return { ...product };
  }

  async findById(
    organizationId: string,
    id: string,
    options?: { withDeleted?: boolean },
  ): Promise<ProductEntity | null> {
    const doc = await this.model.findOne({ _id: id, organizationId }).lean<ProductDoc>().exec();
    if (!doc) return null;
    if (doc.deletedAt !== null && !options?.withDeleted) return null;
    return toProductEntity(doc);
  }

  async update(
    organizationId: string,
    id: string,
    patch: Partial<ProductEntity>,
  ): Promise<ProductEntity | null> {
    const { id: _ignore, ...set } = patch;
    const doc = await this.model
      .findOneAndUpdate({ _id: id, organizationId }, { $set: set }, { returnDocument: 'after' })
      .lean<ProductDoc>()
      .exec();
    return doc ? toProductEntity(doc) : null;
  }

  async list(
    organizationId: string,
    query: ListProductsQuery,
  ): Promise<{ items: ProductEntity[]; total: number }> {
    const filter: ProductListFilter = { organizationId, deletedAt: null };
    if (query.status) filter.status = query.status;
    if (query.categoryId) filter.categoryId = query.categoryId;
    if (query.brandId) filter.brandId = query.brandId;
    if (query.q) filter.name = { $regex: escapeRegex(query.q), $options: 'i' };

    const [total, docs] = await Promise.all([
      this.model.countDocuments(filter).exec(),
      this.model
        .find(filter)
        .sort(productSort(query.sort))
        .skip((query.page - 1) * query.limit)
        .limit(query.limit)
        .lean<ProductDoc[]>()
        .exec(),
    ]);
    return { items: docs.map(toProductEntity), total };
  }
}

/** Secondary `_id` keeps ordering stable across pages, mirroring the in-memory tiebreaker. */
function productSort(sort: ListProductsQuery['sort']): Record<string, SortOrder> {
  const descending = sort.startsWith('-');
  const field = descending ? sort.slice(1) : sort;
  return { [field]: descending ? -1 : 1, _id: 1 };
}

/**
 * Mongoose adapter for variants — implements the `VariantRepository` port. SKU/live lookups filter on
 * `deletedAt: null` exactly as the in-memory adapter does.
 */
@Injectable()
export class MongoVariantRepository implements VariantRepository {
  constructor(@InjectModel(VARIANT_MODEL) private readonly model: Model<VariantDoc>) {}

  async insert(variant: VariantEntity): Promise<VariantEntity> {
    await this.model.create(toVariantDoc(variant));
    return { ...variant };
  }

  async insertMany(variants: VariantEntity[]): Promise<VariantEntity[]> {
    if (variants.length === 0) return [];
    await this.model.insertMany(variants.map(toVariantDoc));
    return variants.map((variant) => ({ ...variant }));
  }

  async findById(organizationId: string, id: string): Promise<VariantEntity | null> {
    const doc = await this.model
      .findOne({ _id: id, organizationId, deletedAt: null })
      .lean<VariantDoc>()
      .exec();
    return doc ? toVariantEntity(doc) : null;
  }

  async findByProduct(organizationId: string, productId: string): Promise<VariantEntity[]> {
    const docs = await this.model
      .find({ organizationId, productId, deletedAt: null })
      .sort({ createdAt: 1, _id: 1 })
      .lean<VariantDoc[]>()
      .exec();
    return docs.map(toVariantEntity);
  }

  async listAll(organizationId: string): Promise<VariantEntity[]> {
    const docs = await this.model
      .find({ organizationId, deletedAt: null })
      .sort({ createdAt: 1, _id: 1 })
      .lean<VariantDoc[]>()
      .exec();
    return docs.map(toVariantEntity);
  }

  async countAll(organizationId: string): Promise<number> {
    return this.model.countDocuments({ organizationId, deletedAt: null }).exec();
  }

  async findLiveBySku(organizationId: string, sku: string): Promise<VariantEntity | null> {
    const doc = await this.model
      .findOne({ organizationId, sku, deletedAt: null })
      .lean<VariantDoc>()
      .exec();
    return doc ? toVariantEntity(doc) : null;
  }

  async update(
    organizationId: string,
    id: string,
    patch: Partial<VariantEntity>,
  ): Promise<VariantEntity | null> {
    const { id: _ignore, ...set } = patch;
    const doc = await this.model
      .findOneAndUpdate({ _id: id, organizationId }, { $set: set }, { returnDocument: 'after' })
      .lean<VariantDoc>()
      .exec();
    return doc ? toVariantEntity(doc) : null;
  }

  async countLiveByProduct(organizationId: string, productId: string): Promise<number> {
    return this.model.countDocuments({ organizationId, productId, deletedAt: null }).exec();
  }
}
