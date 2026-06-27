import { describe, expect, it } from 'vitest';
import {
  CreateTransferRequestSchema,
  ReceiveTransferRequestSchema,
  TransferListQuerySchema,
} from '@stockflow/types';

const HEX24 = 'a'.repeat(24);
const OTHER = 'b'.repeat(24);

describe('CreateTransferRequestSchema', () => {
  const valid = {
    sourceLocationId: HEX24,
    destinationLocationId: OTHER,
    lines: [{ variantId: HEX24, quantity: 5 }],
  };

  it('accepts a valid transfer and rejects unknown fields', () => {
    expect(CreateTransferRequestSchema.safeParse(valid).success).toBe(true);
    expect(CreateTransferRequestSchema.safeParse({ ...valid, foo: 1 }).success).toBe(false);
  });

  it('rejects equal source and destination locations', () => {
    expect(
      CreateTransferRequestSchema.safeParse({ ...valid, destinationLocationId: HEX24 }).success,
    ).toBe(false);
  });

  it('requires at least one line and a positive quantity', () => {
    expect(CreateTransferRequestSchema.safeParse({ ...valid, lines: [] }).success).toBe(false);
    expect(
      CreateTransferRequestSchema.safeParse({ ...valid, lines: [{ variantId: HEX24, quantity: 0 }] }).success,
    ).toBe(false);
  });
});

describe('ReceiveTransferRequestSchema', () => {
  it('requires at least one line with a positive quantity (no location — destination is fixed)', () => {
    expect(ReceiveTransferRequestSchema.safeParse({ lines: [{ lineId: 'l1', quantity: 3 }] }).success).toBe(true);
    expect(ReceiveTransferRequestSchema.safeParse({ lines: [] }).success).toBe(false);
    expect(ReceiveTransferRequestSchema.safeParse({ lines: [{ lineId: 'l1', quantity: 0 }] }).success).toBe(false);
  });
});

describe('TransferListQuerySchema', () => {
  it('defaults to -createdAt and validates status', () => {
    const result = TransferListQuerySchema.safeParse({ page: '2', status: 'in_transit' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.sort).toBe('-createdAt');
      expect(result.data.page).toBe(2);
    }
    expect(TransferListQuerySchema.safeParse({ status: 'shipped' }).success).toBe(false);
  });
});
