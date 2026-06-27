import { describe, expect, it } from 'vitest';
import {
  CreateLocationRequestSchema,
  CreateWarehouseRequestSchema,
  LocationListQuerySchema,
} from '@stockflow/types';

const HEX24 = 'a'.repeat(24);

describe('CreateWarehouseRequestSchema', () => {
  it('accepts a minimal warehouse (name only)', () => {
    expect(CreateWarehouseRequestSchema.safeParse({ name: 'Main DC' }).success).toBe(true);
  });

  it('rejects unknown fields (no mass assignment)', () => {
    expect(CreateWarehouseRequestSchema.safeParse({ name: 'X', organizationId: 'x' }).success).toBe(false);
  });

  it('validates the code and address country', () => {
    expect(CreateWarehouseRequestSchema.safeParse({ name: 'X', code: 'bad code!' }).success).toBe(false);
    expect(CreateWarehouseRequestSchema.safeParse({ name: 'X', code: 'WH-1' }).success).toBe(true);
    expect(CreateWarehouseRequestSchema.safeParse({ name: 'X', address: { country: 'USA' } }).success).toBe(
      false,
    );
  });
});

describe('CreateLocationRequestSchema', () => {
  it('requires a warehouseId and code, and defaults the type to zone', () => {
    expect(CreateLocationRequestSchema.safeParse({ name: 'Z', code: 'A' }).success).toBe(false); // no warehouseId
    const result = CreateLocationRequestSchema.safeParse({ warehouseId: HEX24, name: 'Z', code: 'A' });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.type).toBe('zone');
  });

  it('rejects an invalid location type and a non-hex parent', () => {
    expect(
      CreateLocationRequestSchema.safeParse({ warehouseId: HEX24, name: 'Z', code: 'A', type: 'room' }).success,
    ).toBe(false);
    expect(
      CreateLocationRequestSchema.safeParse({ warehouseId: HEX24, name: 'Z', code: 'A', parentLocationId: 'nope' })
        .success,
    ).toBe(false);
  });
});

describe('LocationListQuerySchema', () => {
  it('defaults to path order and coerces pagination', () => {
    const result = LocationListQuerySchema.safeParse({ page: '2', warehouseId: HEX24, type: 'bin' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.sort).toBe('path');
      expect(result.data.page).toBe(2);
      expect(result.data.type).toBe('bin');
    }
  });

  it('rejects an unknown sort key', () => {
    expect(LocationListQuerySchema.safeParse({ sort: 'sku' }).success).toBe(false);
  });
});
