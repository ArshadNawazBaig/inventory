import { describe, expect, it } from 'vitest';
import {
  CreateProductRequestSchema,
  ListProductsQuerySchema,
  UpdateVariantRequestSchema,
} from '@stockflow/types';

describe('CreateProductRequestSchema', () => {
  it('accepts a valid product and uppercases the SKU', () => {
    const result = CreateProductRequestSchema.safeParse({
      name: 'Widget',
      baseUnitId: 'a'.repeat(24),
      variants: [{ sku: 'wid-1' }],
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.variants[0]?.sku).toBe('WID-1');
    }
  });

  it('requires at least one variant', () => {
    const result = CreateProductRequestSchema.safeParse({
      name: 'Widget',
      baseUnitId: 'a'.repeat(24),
      variants: [],
    });
    expect(result.success).toBe(false);
  });

  it('rejects unknown fields (no mass assignment)', () => {
    const result = CreateProductRequestSchema.safeParse({
      name: 'Widget',
      baseUnitId: 'a'.repeat(24),
      variants: [{ sku: 'WID-1' }],
      organizationId: 'attacker-org',
    });
    expect(result.success).toBe(false);
  });

  it('rejects an invalid SKU pattern', () => {
    const result = CreateProductRequestSchema.safeParse({
      name: 'Widget',
      baseUnitId: 'a'.repeat(24),
      variants: [{ sku: 'bad sku!' }],
    });
    expect(result.success).toBe(false);
  });
});

describe('ListProductsQuerySchema', () => {
  it('coerces page/limit and defaults sort', () => {
    const result = ListProductsQuerySchema.safeParse({ page: '2', limit: '50' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.page).toBe(2);
      expect(result.data.limit).toBe(50);
      expect(result.data.sort).toBe('-createdAt');
    }
  });

  it('enforces the max limit', () => {
    expect(ListProductsQuerySchema.safeParse({ limit: '500' }).success).toBe(false);
  });
});

describe('UpdateVariantRequestSchema', () => {
  it('allows partial updates and clearing barcode to null', () => {
    const result = UpdateVariantRequestSchema.safeParse({ barcode: null, reorderPoint: 10 });
    expect(result.success).toBe(true);
  });
});
