import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import mongoose, { type Model } from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import type { ProductEntity, VariantEntity } from '../../domain/entities';
import { MongoProductRepository, MongoVariantRepository } from './mongo.repositories';
import {
  PRODUCT_MODEL,
  ProductSchema,
  VARIANT_MODEL,
  VariantSchema,
  type ProductDoc,
  type VariantDoc,
} from './schemas';

/**
 * Parity test for the Mongoose Catalog adapters against a real (ephemeral) MongoDB — proves they satisfy the
 * repository ports with the same semantics as the in-memory adapters (tenant scoping, soft-delete, SKU
 * lookups, filters, sort, pagination).
 */

const ORG = 'org-1';
let mem: MongoMemoryServer;
let productModel: Model<ProductDoc>;
let variantModel: Model<VariantDoc>;
let products: MongoProductRepository;
let variants: MongoVariantRepository;

let counter = 0;
const oid = (): string => String(++counter).padStart(24, '0');

function productEntity(over: Partial<ProductEntity> = {}): ProductEntity {
  const at = new Date('2026-01-01T00:00:00.000Z');
  return {
    id: oid(),
    organizationId: ORG,
    name: 'Widget',
    description: null,
    categoryId: null,
    brandId: null,
    baseUnitId: oid(),
    attributes: {},
    imageFileIds: [],
    status: 'active',
    createdAt: at,
    updatedAt: at,
    deletedAt: null,
    createdBy: null,
    updatedBy: null,
    ...over,
  };
}

function variantEntity(over: Partial<VariantEntity> = {}): VariantEntity {
  const at = new Date('2026-01-01T00:00:00.000Z');
  return {
    id: oid(),
    organizationId: ORG,
    productId: oid(),
    sku: `SKU-${oid()}`,
    barcode: null,
    attributes: {},
    unitId: null,
    reorderPoint: 0,
    reorderQty: 0,
    defaultPriceMinor: null,
    currency: null,
    status: 'active',
    createdAt: at,
    updatedAt: at,
    deletedAt: null,
    createdBy: null,
    updatedBy: null,
    ...over,
  };
}

beforeAll(async () => {
  mem = await MongoMemoryServer.create();
  await mongoose.connect(mem.getUri());
  productModel = mongoose.model<ProductDoc>(PRODUCT_MODEL, ProductSchema);
  variantModel = mongoose.model<VariantDoc>(VARIANT_MODEL, VariantSchema);
  products = new MongoProductRepository(productModel);
  variants = new MongoVariantRepository(variantModel);
}, 60_000);

afterEach(async () => {
  await productModel.deleteMany({});
  await variantModel.deleteMany({});
});

afterAll(async () => {
  await mongoose.disconnect();
  await mem.stop();
});

describe('MongoProductRepository', () => {
  it('persists and reads back a product (full roundtrip)', async () => {
    const product = productEntity({ name: 'Alpha', attributes: { color: 'red' }, imageFileIds: ['img1'] });
    await products.insert(product);
    expect(await products.findById(ORG, product.id)).toEqual(product);
  });

  it('hides soft-deleted products unless withDeleted; scopes by tenant', async () => {
    const product = productEntity({ deletedAt: new Date('2026-02-01T00:00:00.000Z') });
    await products.insert(product);
    expect(await products.findById(ORG, product.id)).toBeNull();
    expect(await products.findById(ORG, product.id, { withDeleted: true })).toEqual(product);
    expect(await products.findById('org-2', product.id)).toBeNull();
  });

  it('updates by id within the tenant and returns null for a miss', async () => {
    const product = productEntity({ name: 'Before' });
    await products.insert(product);
    const updated = await products.update(ORG, product.id, { name: 'After', updatedBy: 'user-1' });
    expect(updated).toMatchObject({ id: product.id, name: 'After', updatedBy: 'user-1' });
    expect(await products.update('org-2', product.id, { name: 'Nope' })).toBeNull();
  });

  it('lists with filters, sort and pagination (live only)', async () => {
    await products.insert(productEntity({ name: 'B', status: 'active', createdAt: new Date('2026-01-02T00:00:00.000Z') }));
    await products.insert(productEntity({ name: 'A', status: 'active', createdAt: new Date('2026-01-03T00:00:00.000Z') }));
    await products.insert(productEntity({ name: 'C', status: 'draft', createdAt: new Date('2026-01-01T00:00:00.000Z') }));
    await products.insert(productEntity({ name: 'D', deletedAt: new Date('2026-01-04T00:00:00.000Z') })); // excluded

    const byName = await products.list(ORG, { page: 1, limit: 10, sort: 'name' });
    expect(byName.total).toBe(3);
    expect(byName.items.map((p) => p.name)).toEqual(['A', 'B', 'C']);

    const draft = await products.list(ORG, { page: 1, limit: 10, sort: '-createdAt', status: 'draft' });
    expect(draft.items.map((p) => p.name)).toEqual(['C']);

    const page2 = await products.list(ORG, { page: 2, limit: 1, sort: 'name' });
    expect(page2.items.map((p) => p.name)).toEqual(['B']);
    expect(page2.total).toBe(3);

    const search = await products.list(ORG, { page: 1, limit: 10, sort: 'name', q: 'a' });
    expect(search.items.map((p) => p.name)).toEqual(['A']);
  });
});

describe('MongoVariantRepository', () => {
  it('insertMany + findByProduct + listAll + countAll (live only)', async () => {
    const productId = oid();
    const v1 = variantEntity({ productId, sku: 'V-1' });
    const v2 = variantEntity({ productId, sku: 'V-2' });
    const other = variantEntity({ sku: 'V-3' }); // different product
    await variants.insertMany([v1, v2, other]);

    expect((await variants.findByProduct(ORG, productId)).map((v) => v.sku)).toEqual(['V-1', 'V-2']);
    expect(await variants.countLiveByProduct(ORG, productId)).toBe(2);
    expect((await variants.listAll(ORG)).length).toBe(3);
    expect(await variants.countAll(ORG)).toBe(3);
    expect(await variants.findById(ORG, v1.id)).toEqual(v1);
  });

  it('SKU + id lookups are live-only and tenant-scoped', async () => {
    const live = variantEntity({ sku: 'LIVE' });
    const dead = variantEntity({ sku: 'DEAD', deletedAt: new Date('2026-02-01T00:00:00.000Z') });
    await variants.insertMany([live, dead]);

    expect((await variants.findLiveBySku(ORG, 'LIVE'))?.id).toBe(live.id);
    expect(await variants.findLiveBySku(ORG, 'DEAD')).toBeNull();
    expect(await variants.findById(ORG, dead.id)).toBeNull();
    expect(await variants.findLiveBySku('org-2', 'LIVE')).toBeNull();
    expect(await variants.countAll(ORG)).toBe(1); // dead excluded
  });

  it('updates a variant by id within the tenant', async () => {
    const variant = variantEntity({ reorderPoint: 5 });
    await variants.insert(variant);
    const updated = await variants.update(ORG, variant.id, { reorderPoint: 12 });
    expect(updated).toMatchObject({ id: variant.id, reorderPoint: 12 });
  });
});
