import { describe, expect, it } from 'vitest';
import {
  CreateBrandRequestSchema,
  CreateCategoryRequestSchema,
  CreateUnitRequestSchema,
  LookupListQuerySchema,
} from '@stockflow/types';

describe('CreateCategoryRequestSchema', () => {
  it('accepts a minimal category', () => {
    expect(CreateCategoryRequestSchema.safeParse({ name: 'Tools' }).success).toBe(true);
  });

  it('requires a name', () => {
    expect(CreateCategoryRequestSchema.safeParse({ name: '' }).success).toBe(false);
  });

  it('rejects unknown fields (no mass assignment)', () => {
    const result = CreateCategoryRequestSchema.safeParse({
      name: 'Tools',
      organizationId: 'attacker-org',
    });
    expect(result.success).toBe(false);
  });

  it('validates parentId as a 24-char hex id', () => {
    expect(CreateCategoryRequestSchema.safeParse({ name: 'X', parentId: 'nope' }).success).toBe(false);
    expect(
      CreateCategoryRequestSchema.safeParse({ name: 'X', parentId: 'a'.repeat(24) }).success,
    ).toBe(true);
  });
});

describe('CreateUnitRequestSchema', () => {
  it('requires a code and validates its pattern', () => {
    expect(CreateUnitRequestSchema.safeParse({ name: 'Each' }).success).toBe(false);
    expect(CreateUnitRequestSchema.safeParse({ name: 'Each', code: 'ea' }).success).toBe(true);
    expect(CreateUnitRequestSchema.safeParse({ name: 'Bad', code: 'a b!' }).success).toBe(false);
  });
});

describe('CreateBrandRequestSchema', () => {
  it('validates an optional website URL', () => {
    expect(CreateBrandRequestSchema.safeParse({ name: 'Acme', website: 'not-a-url' }).success).toBe(
      false,
    );
    expect(
      CreateBrandRequestSchema.safeParse({ name: 'Acme', website: 'https://acme.test' }).success,
    ).toBe(true);
  });
});

describe('LookupListQuerySchema', () => {
  it('coerces page/limit and defaults sort to name', () => {
    const result = LookupListQuerySchema.safeParse({ page: '2', limit: '50' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.page).toBe(2);
      expect(result.data.limit).toBe(50);
      expect(result.data.sort).toBe('name');
    }
  });

  it('enforces the max limit', () => {
    expect(LookupListQuerySchema.safeParse({ limit: '500' }).success).toBe(false);
  });
});
