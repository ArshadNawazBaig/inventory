import { z } from 'zod';
import { PageMetaSchema } from './catalog';

/**
 * Point-of-Sale contracts — the single source of truth (validation AND types) for retail selling, shared by
 * API + worker + web. See docs/modules/pos.md. A POS sale sells products from a **store's** location: it posts
 * negative-guarded `shipment` movements out of Inventory (reason `pos_sale`), captures payment, and records an
 * immutable receipt. Walk-in sales (no customer) are allowed. Tax is a documented follow-up (total = subtotal).
 */

// ─── Permissions ───────────────────────────────────────────────────────────────
export const POS_PERMISSIONS = { sell: 'pos.sell', view: 'pos.view' } as const;
export type PosPermission = (typeof POS_PERMISSIONS)[keyof typeof POS_PERMISSIONS];

// ─── Enums ───────────────────────────────────────────────────────────────────
export const PAYMENT_METHODS = ['cash', 'card', 'other'] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

// ─── Reusable field schemas ──────────────────────────────────────────────────
const objectId = z.string().regex(/^[a-fA-F0-9]{24}$/, 'Must be a 24-character hex id');
const currencyField = z.string().regex(/^[A-Z]{3}$/, 'ISO-4217 currency code');
const quantity = z.number().int().min(1, 'Quantity must be at least 1');
const moneyMinor = z.number().int().min(0);

// ─── Requests ─────────────────────────────────────────────────────────────────
export const SaleLineInputSchema = z
  .object({ variantId: objectId, quantity, unitPriceMinor: moneyMinor })
  .strict();
export type SaleLineInput = z.infer<typeof SaleLineInputSchema>;

/** Ring up a sale at a store location. `customerId` is optional (walk-in); the cashier sets the line prices. */
export const CreateSaleRequestSchema = z
  .object({
    locationId: objectId,
    customerId: objectId.optional(),
    currency: currencyField,
    lines: z.array(SaleLineInputSchema).min(1, 'Add at least one item').max(200),
    paymentMethod: z.enum(PAYMENT_METHODS),
    amountTenderedMinor: moneyMinor,
    note: z.string().trim().max(2000).optional(),
  })
  .strict();
export type CreateSaleRequest = z.infer<typeof CreateSaleRequestSchema>;

// ─── Responses ──────────────────────────────────────────────────────────────
export const SaleLineResponseSchema = z.object({
  variantId: z.string(),
  quantity: z.number().int(),
  unitPriceMinor: z.number().int(),
  lineTotalMinor: z.number().int(),
});
export type SaleLineResponse = z.infer<typeof SaleLineResponseSchema>;

export const SaleResponseSchema = z.object({
  id: z.string(),
  receiptNumber: z.string(),
  locationId: z.string(),
  customerId: z.string().nullable(),
  currency: z.string(),
  lines: z.array(SaleLineResponseSchema),
  subtotalMinor: z.number().int(),
  totalMinor: z.number().int(),
  paymentMethod: z.enum(PAYMENT_METHODS),
  amountTenderedMinor: z.number().int(),
  changeMinor: z.number().int(),
  soldByUserId: z.string().nullable(),
  note: z.string().nullable(),
  createdAt: z.string(),
});
export type SaleResponse = z.infer<typeof SaleResponseSchema>;

export const SaleListResponseSchema = z.object({
  data: z.array(SaleResponseSchema),
  meta: PageMetaSchema,
});
export type SaleListResponse = z.infer<typeof SaleListResponseSchema>;

export const SaleListQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    sort: z.enum(['createdAt', '-createdAt']).default('-createdAt'),
    locationId: objectId.optional(),
  })
  .strict();
export type SaleListQuery = z.infer<typeof SaleListQuerySchema>;
