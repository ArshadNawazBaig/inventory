import { describe, expect, it } from 'vitest';
import type { CreateProductRequest } from '@stockflow/types';
import type { ActorContext } from '../../../common/auth/actor-context';
import {
  DuplicateSkuError,
  InvalidReferenceError,
  LastVariantError,
  ProductNotFoundError,
  VariantInUseError,
  VariantNotFoundError,
} from '../domain/catalog.errors';
import type { CatalogEvent, VariantStockSummary } from '../domain/entities';
import {
  InMemoryProductRepository,
  InMemoryVariantRepository,
} from '../infrastructure/in-memory.repositories';
import type {
  CatalogReferencePort,
  Clock,
  EventPublisher,
  IdGenerator,
  InventoryQueryPort,
} from './ports';
import { ProductService } from './product.service';

class CountingIds implements IdGenerator {
  private n = 0;
  generate(): string {
    return `id-${(this.n += 1)}`;
  }
}
class FixedClock implements Clock {
  now(): Date {
    return new Date('2026-01-01T00:00:00.000Z');
  }
}
class RecordingEvents implements EventPublisher {
  readonly events: CatalogEvent[] = [];
  publish(event: CatalogEvent): void {
    this.events.push(event);
  }
}
class FakeInventory implements InventoryQueryPort {
  constructor(private readonly summary: VariantStockSummary) {}
  getVariantStockSummary(): Promise<VariantStockSummary> {
    return Promise.resolve(this.summary);
  }
}
class AllowAllReferences implements CatalogReferencePort {
  categoryExists = (): Promise<boolean> => Promise.resolve(true);
  brandExists = (): Promise<boolean> => Promise.resolve(true);
  unitExists = (): Promise<boolean> => Promise.resolve(true);
}
class NoCategoryReferences extends AllowAllReferences {
  override categoryExists = (): Promise<boolean> => Promise.resolve(false);
}

const EMPTY_STOCK: VariantStockSummary = {
  onHand: 0,
  reserved: 0,
  inTransit: 0,
  hasOpenOrders: false,
};
const ctx: ActorContext = { organizationId: 'org-1', actorId: 'user-1' };

function makeService(opts?: {
  inventory?: InventoryQueryPort;
  references?: CatalogReferencePort;
  events?: RecordingEvents;
}): ProductService {
  return new ProductService(
    new InMemoryProductRepository(),
    new InMemoryVariantRepository(),
    opts?.inventory ?? new FakeInventory(EMPTY_STOCK),
    opts?.references ?? new AllowAllReferences(),
    opts?.events ?? new RecordingEvents(),
    new CountingIds(),
    new FixedClock(),
  );
}

function createInput(overrides: Partial<CreateProductRequest> = {}): CreateProductRequest {
  return { name: 'Widget', baseUnitId: 'unit-1', variants: [{ sku: 'WID-1' }], ...overrides };
}

describe('ProductService.createProduct', () => {
  it('creates a draft product with its variant and emits events', async () => {
    const events = new RecordingEvents();
    const service = makeService({ events });
    const product = await service.createProduct(ctx, createInput());

    expect(product.status).toBe('draft');
    expect(product.organizationId).toBe('org-1');
    expect(product.variants).toHaveLength(1);
    expect(product.variants[0]?.sku).toBe('WID-1');
    expect(events.events.map((e) => e.name)).toEqual(['ProductCreated', 'VariantCreated']);
  });

  it('normalizes lowercase SKUs to uppercase', async () => {
    const service = makeService();
    const product = await service.createProduct(ctx, createInput({ variants: [{ sku: 'wid-2' }] }));
    expect(product.variants[0]?.sku).toBe('WID-2');
  });

  it('rejects duplicate SKUs within the same request', async () => {
    const service = makeService();
    await expect(
      service.createProduct(ctx, createInput({ variants: [{ sku: 'DUP' }, { sku: 'dup' }] })),
    ).rejects.toBeInstanceOf(DuplicateSkuError);
  });

  it('rejects a SKU already used by a live variant', async () => {
    const service = makeService();
    await service.createProduct(ctx, createInput({ variants: [{ sku: 'TAKEN' }] }));
    await expect(
      service.createProduct(ctx, createInput({ variants: [{ sku: 'TAKEN' }] })),
    ).rejects.toBeInstanceOf(DuplicateSkuError);
  });

  it('rejects an invalid category reference (422)', async () => {
    const service = makeService({ references: new NoCategoryReferences() });
    await expect(
      service.createProduct(ctx, createInput({ categoryId: 'cat-1' })),
    ).rejects.toBeInstanceOf(InvalidReferenceError);
  });
});

describe('ProductService reads', () => {
  it('gets a product with its variants', async () => {
    const service = makeService();
    const created = await service.createProduct(ctx, createInput());
    const fetched = await service.getProduct(ctx, created.id);
    expect(fetched.id).toBe(created.id);
    expect(fetched.variants).toHaveLength(1);
  });

  it('isolates tenants (cross-tenant get is not found)', async () => {
    const service = makeService();
    const created = await service.createProduct(ctx, createInput());
    await expect(
      service.getProduct({ organizationId: 'org-2', actorId: null }, created.id),
    ).rejects.toBeInstanceOf(ProductNotFoundError);
  });

  it('lists with filtering and pagination + variantCount', async () => {
    const service = makeService();
    await service.createProduct(ctx, createInput({ name: 'Alpha', variants: [{ sku: 'A1' }] }));
    await service.createProduct(ctx, createInput({ name: 'Beta', variants: [{ sku: 'B1' }] }));
    await service.createProduct(ctx, createInput({ name: 'Gamma', variants: [{ sku: 'G1' }] }));

    const page = await service.listProducts(ctx, { page: 1, limit: 2, sort: 'name' });
    expect(page.total).toBe(3);
    expect(page.items).toHaveLength(2);
    expect(page.items[0]?.name).toBe('Alpha');
    expect(page.items[0]?.variantCount).toBe(1);

    const filtered = await service.listProducts(ctx, { page: 1, limit: 20, sort: 'name', q: 'bet' });
    expect(filtered.total).toBe(1);
    expect(filtered.items[0]?.name).toBe('Beta');
  });
});

describe('ProductService lifecycle', () => {
  it('updates fields and throws on missing product', async () => {
    const service = makeService();
    const created = await service.createProduct(ctx, createInput());
    const updated = await service.updateProduct(ctx, created.id, { name: 'Renamed' });
    expect(updated.name).toBe('Renamed');
    await expect(service.updateProduct(ctx, 'nope', { name: 'x' })).rejects.toBeInstanceOf(
      ProductNotFoundError,
    );
  });

  it('archives then restores', async () => {
    const service = makeService();
    const created = await service.createProduct(ctx, createInput());
    expect((await service.archiveProduct(ctx, created.id)).status).toBe('archived');
    expect((await service.restoreProduct(ctx, created.id)).status).toBe('active');
  });

  it('soft-deletes a product, then it is no longer found', async () => {
    const service = makeService();
    const created = await service.createProduct(ctx, createInput());
    await service.deleteProduct(ctx, created.id);
    await expect(service.getProduct(ctx, created.id)).rejects.toBeInstanceOf(ProductNotFoundError);
  });

  it('blocks deleting a product whose variant has stock', async () => {
    const service = makeService({
      inventory: new FakeInventory({ ...EMPTY_STOCK, onHand: 5 }),
    });
    const created = await service.createProduct(ctx, createInput());
    await expect(service.deleteProduct(ctx, created.id)).rejects.toBeInstanceOf(VariantInUseError);
  });
});

describe('ProductService variants', () => {
  it('adds a variant and rejects duplicate SKU', async () => {
    const service = makeService();
    const created = await service.createProduct(ctx, createInput());
    const added = await service.addVariant(ctx, created.id, { sku: 'WID-2' });
    expect(added.productId).toBe(created.id);
    await expect(service.addVariant(ctx, created.id, { sku: 'WID-1' })).rejects.toBeInstanceOf(
      DuplicateSkuError,
    );
  });

  it('rejects updating a variant SKU to one already in use', async () => {
    const service = makeService();
    const created = await service.createProduct(ctx, createInput());
    const second = await service.addVariant(ctx, created.id, { sku: 'WID-2' });
    await expect(
      service.updateVariant(ctx, created.id, second.id, { sku: 'WID-1' }),
    ).rejects.toBeInstanceOf(DuplicateSkuError);
  });

  it('blocks deleting the last variant', async () => {
    const service = makeService();
    const created = await service.createProduct(ctx, createInput());
    const variantId = created.variants[0]?.id ?? '';
    await expect(service.deleteVariant(ctx, created.id, variantId)).rejects.toBeInstanceOf(
      LastVariantError,
    );
  });

  it('deletes a non-last variant with no stock', async () => {
    const service = makeService();
    const created = await service.createProduct(ctx, createInput());
    const second = await service.addVariant(ctx, created.id, { sku: 'WID-2' });
    await service.deleteVariant(ctx, created.id, second.id);
    await expect(service.getVariant(ctx, created.id, second.id)).rejects.toBeInstanceOf(
      VariantNotFoundError,
    );
  });

  it('blocks deleting a variant that has stock', async () => {
    const service = makeService({ inventory: new FakeInventory({ ...EMPTY_STOCK, reserved: 2 }) });
    const created = await service.createProduct(ctx, createInput());
    await service.addVariant(ctx, created.id, { sku: 'WID-2' });
    const variantId = created.variants[0]?.id ?? '';
    await expect(service.deleteVariant(ctx, created.id, variantId)).rejects.toBeInstanceOf(
      VariantInUseError,
    );
  });
});
