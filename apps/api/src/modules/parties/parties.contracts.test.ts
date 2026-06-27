import { describe, expect, it } from 'vitest';
import {
  AddressInputSchema,
  CreateCustomerRequestSchema,
  CreateSupplierRequestSchema,
} from '@stockflow/types';

describe('CreateSupplierRequestSchema', () => {
  it('accepts a minimal supplier (name only)', () => {
    expect(CreateSupplierRequestSchema.safeParse({ name: 'Acme' }).success).toBe(true);
  });

  it('rejects unknown fields (no mass assignment)', () => {
    const result = CreateSupplierRequestSchema.safeParse({ name: 'Acme', organizationId: 'x' });
    expect(result.success).toBe(false);
  });

  it('validates email, website, currency and code', () => {
    expect(CreateSupplierRequestSchema.safeParse({ name: 'A', email: 'nope' }).success).toBe(false);
    expect(CreateSupplierRequestSchema.safeParse({ name: 'A', website: 'nope' }).success).toBe(false);
    expect(CreateSupplierRequestSchema.safeParse({ name: 'A', currency: 'usd' }).success).toBe(false);
    expect(CreateSupplierRequestSchema.safeParse({ name: 'A', currency: 'USD' }).success).toBe(true);
    expect(CreateSupplierRequestSchema.safeParse({ name: 'A', code: 'bad code!' }).success).toBe(false);
  });

  it('rejects a negative lead time', () => {
    expect(CreateSupplierRequestSchema.safeParse({ name: 'A', leadTimeDays: -1 }).success).toBe(false);
  });
});

describe('CreateCustomerRequestSchema', () => {
  it('defaults customerType to business', () => {
    const result = CreateCustomerRequestSchema.safeParse({ name: 'Jane' });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.customerType).toBe('business');
  });

  it('rejects an invalid customer type', () => {
    expect(CreateCustomerRequestSchema.safeParse({ name: 'Jane', customerType: 'vip' }).success).toBe(
      false,
    );
  });

  it('requires a non-negative credit limit', () => {
    expect(CreateCustomerRequestSchema.safeParse({ name: 'Jane', creditLimitMinor: -5 }).success).toBe(
      false,
    );
  });
});

describe('AddressInputSchema', () => {
  it('accepts a partial address', () => {
    expect(AddressInputSchema.safeParse({ city: 'Springfield' }).success).toBe(true);
  });

  it('validates the country as a 2-letter code', () => {
    expect(AddressInputSchema.safeParse({ country: 'USA' }).success).toBe(false);
    expect(AddressInputSchema.safeParse({ country: 'us' }).success).toBe(true);
  });
});
