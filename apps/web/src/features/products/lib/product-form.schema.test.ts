import { describe, it, expect } from 'vitest';
import type { VariantResponse } from '@stockflow/types';
import {
  createProductFormSchema,
  emptyVariantForm,
  toCreateProductRequest,
  toCreateVariant,
  toUpdateProductRequest,
  toUpdateVariantRequest,
  variantToFormValues,
  type CreateProductFormValues,
} from './product-form.schema';

const HEX = 'a'.repeat(24);

function makeForm(overrides: Partial<CreateProductFormValues> = {}): CreateProductFormValues {
  return {
    name: 'Wireless mouse',
    description: '',
    baseUnitId: HEX,
    categoryId: '',
    brandId: '',
    variants: [{ ...emptyVariantForm, sku: 'tw-1' }],
    ...overrides,
  };
}

describe('createProductFormSchema', () => {
  it('accepts a valid product with one variant', () => {
    expect(createProductFormSchema.safeParse(makeForm()).success).toBe(true);
  });

  it('requires a name', () => {
    expect(createProductFormSchema.safeParse(makeForm({ name: '' })).success).toBe(false);
  });

  it('requires a 24-char hex base unit', () => {
    expect(createProductFormSchema.safeParse(makeForm({ baseUnitId: 'not-hex' })).success).toBe(false);
  });

  it('requires at least one variant', () => {
    expect(createProductFormSchema.safeParse(makeForm({ variants: [] })).success).toBe(false);
  });

  it('rejects illegal SKU characters', () => {
    const result = createProductFormSchema.safeParse(
      makeForm({ variants: [{ ...emptyVariantForm, sku: 'bad sku!' }] }),
    );
    expect(result.success).toBe(false);
  });
});

describe('toCreateProductRequest', () => {
  it('trims the name, uppercases SKUs, and converts price to minor units', () => {
    const request = toCreateProductRequest(
      makeForm({
        name: '  Wireless mouse  ',
        variants: [
          { ...emptyVariantForm, sku: 'tw-1', price: '12.50', currency: 'usd', reorderPoint: '5' },
        ],
      }),
    );
    expect(request.name).toBe('Wireless mouse');
    expect(request.variants[0]?.sku).toBe('TW-1');
    expect(request.variants[0]?.defaultPriceMinor).toBe(1250);
    expect(request.variants[0]?.currency).toBe('USD');
    expect(request.variants[0]?.reorderPoint).toBe(5);
  });

  it('omits blank optional product fields', () => {
    const request = toCreateProductRequest(makeForm());
    expect(request.description).toBeUndefined();
    expect(request.categoryId).toBeUndefined();
    expect(request.brandId).toBeUndefined();
  });

  it('includes optional product fields when filled', () => {
    const request = toCreateProductRequest(makeForm({ description: 'Nice', categoryId: HEX }));
    expect(request.description).toBe('Nice');
    expect(request.categoryId).toBe(HEX);
  });
});

describe('toCreateVariant', () => {
  it('only sets currency when a price is present', () => {
    const request = toCreateVariant({ ...emptyVariantForm, sku: 'a1', currency: 'USD' });
    expect(request.defaultPriceMinor).toBeUndefined();
    expect(request.currency).toBeUndefined();
    expect(request.sku).toBe('A1');
  });
});

describe('toUpdateProductRequest', () => {
  it('sends null to clear blank optionals', () => {
    const request = toUpdateProductRequest({
      name: 'Mouse',
      description: '',
      baseUnitId: HEX,
      categoryId: '',
      brandId: '',
    });
    expect(request.description).toBeNull();
    expect(request.categoryId).toBeNull();
    expect(request.brandId).toBeNull();
  });
});

describe('toUpdateVariantRequest', () => {
  it('clears price/currency when blank and uppercases the SKU', () => {
    const request = toUpdateVariantRequest({ ...emptyVariantForm, sku: 'a1' });
    expect(request.sku).toBe('A1');
    expect(request.defaultPriceMinor).toBeNull();
    expect(request.currency).toBeNull();
    expect(request.barcode).toBeNull();
  });
});

describe('variantToFormValues', () => {
  it('formats price + counts back to editable strings', () => {
    const variant: VariantResponse = {
      id: 'v1',
      productId: 'p1',
      sku: 'A1',
      barcode: null,
      attributes: {},
      unitId: null,
      reorderPoint: 3,
      reorderQty: 7,
      defaultPriceMinor: 1599,
      currency: 'USD',
      status: 'active',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    };
    const values = variantToFormValues(variant);
    expect(values.price).toBe('15.99');
    expect(values.reorderPoint).toBe('3');
    expect(values.reorderQty).toBe('7');
    expect(values.currency).toBe('USD');
    expect(values.barcode).toBe('');
  });
});
