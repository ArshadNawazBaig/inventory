import { z } from 'zod';
import { PageMetaSchema } from './catalog';

/**
 * Purchasing contracts (Purchase Orders) — the single source of truth for validation AND types, shared by
 * API + worker + web. See docs/modules/purchasing.md and DATABASE §7. A PO is an inbound order to a
 * supplier; **receiving posts `receipt` movements** into Inventory (driving weighted-average cost). Lines
 * are embedded and snapshot the variant's sku/name at order time (historical accuracy).
 */

// ─── Permissions ───────────────────────────────────────────────────────────────
export const PURCHASE_ORDER_PERMISSIONS = {
  view: 'purchase_order.view',
  manage: 'purchase_order.manage',
} as const;
export type PurchaseOrderPermission =
  (typeof PURCHASE_ORDER_PERMISSIONS)[keyof typeof PURCHASE_ORDER_PERMISSIONS];

// ─── Status ──────────────────────────────────────────────────────────────────
export const PURCHASE_ORDER_STATUS = [
  'draft',
  'submitted',
  'partially_received',
  'received',
  'cancelled',
] as const;
export type PurchaseOrderStatus = (typeof PURCHASE_ORDER_STATUS)[number];

// ─── Reusable field schemas ──────────────────────────────────────────────────
const objectId = z.string().regex(/^[a-fA-F0-9]{24}$/, 'Must be a 24-character hex id');
const currencyField = z.string().regex(/^[A-Z]{3}$/, 'ISO-4217 currency code');
const orderedQty = z.number().int().min(1, 'Quantity must be at least 1');
const receiveQty = z.number().int().min(1, 'Quantity must be at least 1');
const moneyMinor = z.number().int().min(0);
const dateField = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date as YYYY-MM-DD');
const noteField = z.string().trim().max(2000);

export const OrderTotalsSchema = z.object({
  subtotalMinor: z.number().int(),
  taxMinor: z.number().int(),
  totalMinor: z.number().int(),
});
export type OrderTotals = z.infer<typeof OrderTotalsSchema>;

// ─── Requests ────────────────────────────────────────────────────────────────
export const PurchaseOrderLineInputSchema = z
  .object({
    variantId: objectId,
    orderedQty,
    unitCostMinor: moneyMinor,
  })
  .strict();
export type PurchaseOrderLineInput = z.infer<typeof PurchaseOrderLineInputSchema>;

export const CreatePurchaseOrderRequestSchema = z
  .object({
    supplierId: objectId,
    warehouseId: objectId,
    currency: currencyField,
    expectedAt: dateField.optional(),
    note: noteField.optional(),
    lines: z.array(PurchaseOrderLineInputSchema).min(1, 'At least one line is required').max(200),
  })
  .strict();
export type CreatePurchaseOrderRequest = z.infer<typeof CreatePurchaseOrderRequestSchema>;

/** Update a **draft** PO (supplier is fixed after creation). Replaces the line set. */
export const UpdatePurchaseOrderRequestSchema = z
  .object({
    warehouseId: objectId,
    currency: currencyField,
    expectedAt: dateField.nullable(),
    note: noteField.nullable(),
    lines: z.array(PurchaseOrderLineInputSchema).min(1).max(200),
  })
  .partial()
  .strict();
export type UpdatePurchaseOrderRequest = z.infer<typeof UpdatePurchaseOrderRequestSchema>;

/** Receive stock against a PO — posts `receipt` movements into `locationId` and advances line/PO status. */
export const ReceivePurchaseOrderRequestSchema = z
  .object({
    locationId: objectId,
    lines: z
      .array(z.object({ lineId: z.string().min(1), quantity: receiveQty }).strict())
      .min(1, 'At least one line is required'),
  })
  .strict();
export type ReceivePurchaseOrderRequest = z.infer<typeof ReceivePurchaseOrderRequestSchema>;

// ─── Responses ───────────────────────────────────────────────────────────────
export const PurchaseOrderLineResponseSchema = z.object({
  id: z.string(),
  variantId: z.string(),
  skuSnapshot: z.string(),
  nameSnapshot: z.string(),
  orderedQty: z.number().int(),
  receivedQty: z.number().int(),
  unitCostMinor: z.number().int(),
});
export type PurchaseOrderLineResponse = z.infer<typeof PurchaseOrderLineResponseSchema>;

const purchaseOrderBase = {
  id: z.string(),
  poNumber: z.string(),
  supplierId: z.string(),
  supplierName: z.string().nullable(),
  warehouseId: z.string(),
  currency: z.string(),
  status: z.enum(PURCHASE_ORDER_STATUS),
  expectedAt: z.string().nullable(),
  totals: OrderTotalsSchema,
  createdAt: z.string(),
  updatedAt: z.string(),
};

/** Detail — includes embedded lines + note. */
export const PurchaseOrderResponseSchema = z.object({
  ...purchaseOrderBase,
  note: z.string().nullable(),
  lines: z.array(PurchaseOrderLineResponseSchema),
});
export type PurchaseOrderResponse = z.infer<typeof PurchaseOrderResponseSchema>;

/** List item — omits lines for brevity; carries `lineCount`. */
export const PurchaseOrderSummarySchema = z.object({
  ...purchaseOrderBase,
  lineCount: z.number().int(),
});
export type PurchaseOrderSummary = z.infer<typeof PurchaseOrderSummarySchema>;

export const PurchaseOrderListResponseSchema = z.object({
  data: z.array(PurchaseOrderSummarySchema),
  meta: PageMetaSchema,
});
export type PurchaseOrderListResponse = z.infer<typeof PurchaseOrderListResponseSchema>;

export const PurchaseOrderListQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    sort: z.enum(['createdAt', '-createdAt', 'poNumber', '-poNumber']).default('-createdAt'),
    status: z.enum(PURCHASE_ORDER_STATUS).optional(),
    supplierId: objectId.optional(),
    q: z.string().trim().min(1).max(100).optional(),
  })
  .strict();
export type PurchaseOrderListQuery = z.infer<typeof PurchaseOrderListQuerySchema>;
