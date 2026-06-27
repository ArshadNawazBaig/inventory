import { describe, expect, it } from 'vitest';
import { CreateReturnRequestSchema, ReturnListQuerySchema } from '@stockflow/types';

const HEX24 = 'a'.repeat(24);

describe('CreateReturnRequestSchema', () => {
  const valid = {
    kind: 'customer',
    partyId: HEX24,
    locationId: HEX24,
    lines: [{ variantId: HEX24, quantity: 5 }],
  };

  it('accepts a valid return and rejects unknown fields', () => {
    expect(CreateReturnRequestSchema.safeParse(valid).success).toBe(true);
    expect(CreateReturnRequestSchema.safeParse({ ...valid, foo: 1 }).success).toBe(false);
  });

  it('validates the kind discriminator', () => {
    expect(CreateReturnRequestSchema.safeParse({ ...valid, kind: 'supplier' }).success).toBe(true);
    expect(CreateReturnRequestSchema.safeParse({ ...valid, kind: 'partner' }).success).toBe(false);
  });

  it('requires at least one line and a positive quantity', () => {
    expect(CreateReturnRequestSchema.safeParse({ ...valid, lines: [] }).success).toBe(false);
    expect(
      CreateReturnRequestSchema.safeParse({ ...valid, lines: [{ variantId: HEX24, quantity: 0 }] }).success,
    ).toBe(false);
  });
});

describe('ReturnListQuerySchema', () => {
  it('defaults to -createdAt and validates kind + status', () => {
    const result = ReturnListQuerySchema.safeParse({ page: '2', kind: 'supplier', status: 'completed' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.sort).toBe('-createdAt');
      expect(result.data.page).toBe(2);
    }
    expect(ReturnListQuerySchema.safeParse({ status: 'shipped' }).success).toBe(false);
  });
});
