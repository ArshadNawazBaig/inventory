import { z } from 'zod';
import { PageMetaSchema } from './catalog';
import { OrderTotalsSchema } from './purchasing';

/**
 * Sales contracts (Sales Orders) — the single source of truth for validation AND types, shared by API +
 * worker + web. See docs/modules/sales.md and DATABASE §8. An SO is an outbound order to a customer;
 * **fulfilling posts `shipment` movements** out of Inventory (negative-guarded). Lines are embedded and
 * snapshot the variant's sku/name + price at order time (historical accuracy).
 */

// ─── Permissions ───────────────────────────────────────────────────────────────
export const SALES_ORDER_PERMISSIONS = {
  view: 'sales_order.view',
  manage: 'sales_order.manage',
} as const;
export type SalesOrderPermission =
  (typeof SALES_ORDER_PERMISSIONS)[keyof typeof SALES_ORDER_PERMISSIONS];

// ─── Status ──────────────────────────────────────────────────────────────────
export const SALES_ORDER_STATUS = [
  'draft',
  'confirmed',
  'partially_fulfilled',
  'fulfilled',
  'cancelled',
] as const;
export type SalesOrderStatus = (typeof SALES_ORDER_STATUS)[number];

// ─── Reusable field schemas ──────────────────────────────────────────────────
const objectId = z.string().regex(/^[a-fA-F0-9]{24}$/, 'Must be a 24-character hex id');
const currencyField = z.string().regex(/^[A-Z]{3}$/, 'ISO-4217 currency code');
const orderedQty = z.number().int().min(1, 'Quantity must be at least 1');
const fulfillQty = z.number().int().min(1, 'Quantity must be at least 1');
const moneyMinor = z.number().int().min(0);
const noteField = z.string().trim().max(2000);

// ─── Requests ────────────────────────────────────────────────────────────────
export const SalesOrderLineInputSchema = z
  .object({
    variantId: objectId,
    orderedQty,
    unitPriceMinor: moneyMinor,
  })
  .strict();
export type SalesOrderLineInput = z.infer<typeof SalesOrderLineInputSchema>;

export const CreateSalesOrderRequestSchema = z
  .object({
    customerId: objectId,
    warehouseId: objectId,
    currency: currencyField,
    note: noteField.optional(),
    lines: z.array(SalesOrderLineInputSchema).min(1, 'At least one line is required').max(200),
  })
  .strict();
export type CreateSalesOrderRequest = z.infer<typeof CreateSalesOrderRequestSchema>;

/** Update a **draft** SO (customer is fixed after creation). Replaces the line set. */
export const UpdateSalesOrderRequestSchema = z
  .object({
    warehouseId: objectId,
    currency: currencyField,
    note: noteField.nullable(),
    lines: z.array(SalesOrderLineInputSchema).min(1).max(200),
  })
  .partial()
  .strict();
export type UpdateSalesOrderRequest = z.infer<typeof UpdateSalesOrderRequestSchema>;

/** Fulfill an SO — posts `shipment` movements out of `locationId` and advances line/SO status. */
export const FulfillSalesOrderRequestSchema = z
  .object({
    locationId: objectId,
    lines: z
      .array(z.object({ lineId: z.string().min(1), quantity: fulfillQty }).strict())
      .min(1, 'At least one line is required'),
  })
  .strict();
export type FulfillSalesOrderRequest = z.infer<typeof FulfillSalesOrderRequestSchema>;

// ─── Responses ───────────────────────────────────────────────────────────────
export const SalesOrderLineResponseSchema = z.object({
  id: z.string(),
  variantId: z.string(),
  skuSnapshot: z.string(),
  nameSnapshot: z.string(),
  orderedQty: z.number().int(),
  shippedQty: z.number().int(),
  unitPriceMinor: z.number().int(),
});
export type SalesOrderLineResponse = z.infer<typeof SalesOrderLineResponseSchema>;

const salesOrderBase = {
  id: z.string(),
  soNumber: z.string(),
  customerId: z.string(),
  customerName: z.string().nullable(),
  warehouseId: z.string(),
  currency: z.string(),
  status: z.enum(SALES_ORDER_STATUS),
  totals: OrderTotalsSchema,
  createdAt: z.string(),
  updatedAt: z.string(),
};

/** Detail — includes embedded lines + note. */
export const SalesOrderResponseSchema = z.object({
  ...salesOrderBase,
  note: z.string().nullable(),
  lines: z.array(SalesOrderLineResponseSchema),
});
export type SalesOrderResponse = z.infer<typeof SalesOrderResponseSchema>;

/** List item — omits lines for brevity; carries `lineCount`. */
export const SalesOrderSummarySchema = z.object({
  ...salesOrderBase,
  lineCount: z.number().int(),
});
export type SalesOrderSummary = z.infer<typeof SalesOrderSummarySchema>;

export const SalesOrderListResponseSchema = z.object({
  data: z.array(SalesOrderSummarySchema),
  meta: PageMetaSchema,
});
export type SalesOrderListResponse = z.infer<typeof SalesOrderListResponseSchema>;

export const SalesOrderListQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    sort: z.enum(['createdAt', '-createdAt', 'soNumber', '-soNumber']).default('-createdAt'),
    status: z.enum(SALES_ORDER_STATUS).optional(),
    customerId: objectId.optional(),
    q: z.string().trim().min(1).max(100).optional(),
  })
  .strict();
export type SalesOrderListQuery = z.infer<typeof SalesOrderListQuerySchema>;
