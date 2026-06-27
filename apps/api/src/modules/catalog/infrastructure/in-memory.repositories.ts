import { Injectable } from '@nestjs/common';
import type { ListProductsQuery } from '@stockflow/types';
import type { ProductEntity, VariantEntity } from '../domain/entities';
import type { ProductRepository, VariantRepository } from '../application/ports';

/**
 * In-memory adapters — the runnable, fully-testable persistence for the Product
 * module until the database module lands. The Mongoose adapters implement the same
 * ports and drop in without touching the application layer (dependency inversion).
 */
@Injectable()
export class InMemoryProductRepository implements ProductRepository {
  private readonly store = new Map<string, ProductEntity>();

  insert(product: ProductEntity): Promise<ProductEntity> {
    this.store.set(product.id, { ...product });
    return Promise.resolve({ ...product });
  }

  findById(
    organizationId: string,
    id: string,
    options?: { withDeleted?: boolean },
  ): Promise<ProductEntity | null> {
    const found = this.store.get(id);
    if (!found || found.organizationId !== organizationId) {
      return Promise.resolve(null);
    }
    if (found.deletedAt !== null && !options?.withDeleted) {
      return Promise.resolve(null);
    }
    return Promise.resolve({ ...found });
  }

  update(
    organizationId: string,
    id: string,
    patch: Partial<ProductEntity>,
  ): Promise<ProductEntity | null> {
    const found = this.store.get(id);
    if (!found || found.organizationId !== organizationId) {
      return Promise.resolve(null);
    }
    const next = { ...found, ...patch };
    this.store.set(id, next);
    return Promise.resolve({ ...next });
  }

  list(
    organizationId: string,
    query: ListProductsQuery,
  ): Promise<{ items: ProductEntity[]; total: number }> {
    let items = [...this.store.values()].filter(
      (p) => p.organizationId === organizationId && p.deletedAt === null,
    );
    if (query.status) items = items.filter((p) => p.status === query.status);
    if (query.categoryId) items = items.filter((p) => p.categoryId === query.categoryId);
    if (query.brandId) items = items.filter((p) => p.brandId === query.brandId);
    if (query.q) {
      const needle = query.q.toLowerCase();
      items = items.filter((p) => p.name.toLowerCase().includes(needle));
    }
    items.sort(this.comparator(query.sort));

    const total = items.length;
    const start = (query.page - 1) * query.limit;
    const page = items.slice(start, start + query.limit).map((p) => ({ ...p }));
    return Promise.resolve({ items: page, total });
  }

  private comparator(sort: ListProductsQuery['sort']): (a: ProductEntity, b: ProductEntity) => number {
    const descending = sort.startsWith('-');
    const field = (descending ? sort.slice(1) : sort) as 'name' | 'createdAt' | 'updatedAt';
    const direction = descending ? -1 : 1;
    return (a, b) => {
      const left = field === 'name' ? a.name : a[field].getTime();
      const right = field === 'name' ? b.name : b[field].getTime();
      if (left < right) return -1 * direction;
      if (left > right) return 1 * direction;
      return a.id < b.id ? -1 : 1; // stable tiebreaker
    };
  }
}

@Injectable()
export class InMemoryVariantRepository implements VariantRepository {
  private readonly store = new Map<string, VariantEntity>();

  insert(variant: VariantEntity): Promise<VariantEntity> {
    this.store.set(variant.id, { ...variant });
    return Promise.resolve({ ...variant });
  }

  insertMany(variants: VariantEntity[]): Promise<VariantEntity[]> {
    for (const variant of variants) {
      this.store.set(variant.id, { ...variant });
    }
    return Promise.resolve(variants.map((v) => ({ ...v })));
  }

  findById(organizationId: string, id: string): Promise<VariantEntity | null> {
    const found = this.store.get(id);
    if (!found || found.organizationId !== organizationId || found.deletedAt !== null) {
      return Promise.resolve(null);
    }
    return Promise.resolve({ ...found });
  }

  findByProduct(organizationId: string, productId: string): Promise<VariantEntity[]> {
    const items = [...this.store.values()].filter(
      (v) => v.organizationId === organizationId && v.productId === productId && v.deletedAt === null,
    );
    return Promise.resolve(items.map((v) => ({ ...v })));
  }

  listAll(organizationId: string): Promise<VariantEntity[]> {
    const items = [...this.store.values()].filter(
      (v) => v.organizationId === organizationId && v.deletedAt === null,
    );
    return Promise.resolve(items.map((v) => ({ ...v })));
  }

  countAll(organizationId: string): Promise<number> {
    let count = 0;
    for (const v of this.store.values()) {
      if (v.organizationId === organizationId && v.deletedAt === null) count += 1;
    }
    return Promise.resolve(count);
  }

  findLiveBySku(organizationId: string, sku: string): Promise<VariantEntity | null> {
    const found = [...this.store.values()].find(
      (v) => v.organizationId === organizationId && v.sku === sku && v.deletedAt === null,
    );
    return Promise.resolve(found ? { ...found } : null);
  }

  update(
    organizationId: string,
    id: string,
    patch: Partial<VariantEntity>,
  ): Promise<VariantEntity | null> {
    const found = this.store.get(id);
    if (!found || found.organizationId !== organizationId) {
      return Promise.resolve(null);
    }
    const next = { ...found, ...patch };
    this.store.set(id, next);
    return Promise.resolve({ ...next });
  }

  countLiveByProduct(organizationId: string, productId: string): Promise<number> {
    const count = [...this.store.values()].filter(
      (v) => v.organizationId === organizationId && v.productId === productId && v.deletedAt === null,
    ).length;
    return Promise.resolve(count);
  }
}
