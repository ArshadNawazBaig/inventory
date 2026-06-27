import { describe, it, expect } from 'vitest';
import type { BrandResponse, CategoryResponse, UnitResponse } from '@stockflow/types';
import {
  brandFormSchema,
  brandToForm,
  categoryFormSchema,
  categoryToForm,
  emptyCategoryForm,
  toCreateBrand,
  toCreateCategory,
  toCreateUnit,
  toUpdateCategory,
  toUpdateUnit,
  unitFormSchema,
  unitToForm,
} from './forms';

const HEX = 'a'.repeat(24);

describe('categoryFormSchema', () => {
  it('accepts a valid category', () => {
    expect(categoryFormSchema.safeParse({ name: 'Tools', description: '', parentId: '' }).success).toBe(
      true,
    );
  });
  it('rejects a malformed parentId', () => {
    expect(
      categoryFormSchema.safeParse({ name: 'Tools', description: '', parentId: 'nope' }).success,
    ).toBe(false);
  });
  it('requires a name', () => {
    expect(categoryFormSchema.safeParse({ ...emptyCategoryForm, name: '' }).success).toBe(false);
  });
});

describe('toCreateCategory', () => {
  it('trims and omits blank optionals', () => {
    const request = toCreateCategory({ name: '  Tools  ', description: '', parentId: '' });
    expect(request).toEqual({ name: 'Tools' });
  });
  it('includes parentId when present', () => {
    const request = toCreateCategory({ name: 'Wrenches', description: 'x', parentId: HEX });
    expect(request).toEqual({ name: 'Wrenches', description: 'x', parentId: HEX });
  });
});

describe('toUpdateCategory', () => {
  it('nulls blank optionals to clear them', () => {
    const request = toUpdateCategory({ name: 'Tools', description: '', parentId: '' });
    expect(request).toEqual({ name: 'Tools', description: null, parentId: null });
  });
});

describe('brandFormSchema + mappers', () => {
  it('validates the website URL', () => {
    expect(brandFormSchema.safeParse({ name: 'Acme', description: '', website: 'nope' }).success).toBe(
      false,
    );
    expect(
      brandFormSchema.safeParse({ name: 'Acme', description: '', website: 'https://acme.test' })
        .success,
    ).toBe(true);
  });
  it('omits a blank website on create', () => {
    expect(toCreateBrand({ name: 'Acme', description: '', website: '' })).toEqual({ name: 'Acme' });
  });
});

describe('unitFormSchema + mappers', () => {
  it('requires a code and validates its pattern', () => {
    expect(unitFormSchema.safeParse({ name: 'Each', description: '', code: '' }).success).toBe(false);
    expect(unitFormSchema.safeParse({ name: 'Each', description: '', code: 'a b!' }).success).toBe(
      false,
    );
    expect(unitFormSchema.safeParse({ name: 'Each', description: '', code: 'ea' }).success).toBe(true);
  });
  it('always sends name + code; nulls blank description on update', () => {
    expect(toCreateUnit({ name: 'Each', description: '', code: 'ea' })).toEqual({
      name: 'Each',
      code: 'ea',
    });
    expect(toUpdateUnit({ name: 'Each', description: '', code: 'ea' })).toEqual({
      name: 'Each',
      code: 'ea',
      description: null,
    });
  });
});

describe('response → form mappers', () => {
  const base = { status: 'active' as const, createdAt: '', updatedAt: '' };
  it('maps null fields to empty strings', () => {
    const category: CategoryResponse = { id: '1', name: 'Tools', description: null, parentId: null, ...base };
    expect(categoryToForm(category)).toEqual({ name: 'Tools', description: '', parentId: '' });

    const brand: BrandResponse = { id: '1', name: 'Acme', description: null, website: null, ...base };
    expect(brandToForm(brand)).toEqual({ name: 'Acme', description: '', website: '' });

    const unit: UnitResponse = { id: '1', name: 'Each', description: null, code: 'ea', ...base };
    expect(unitToForm(unit)).toEqual({ name: 'Each', description: '', code: 'ea' });
  });
});
