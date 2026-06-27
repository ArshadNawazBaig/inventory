import { z } from 'zod';
import { PageMetaSchema } from './catalog';

/**
 * Returns contracts (customer + supplier returns) — the single source of truth for validation AND types,
 * shared by API + worker + web. See docs/modules/returns.md and DATABASE §10. A return is `kind`-discriminated:
 * a **customer** return brings stock back in (**completing posts `return_in`**); a **supplier** return sends
 * stock back out (**completing posts `return_out`**, negative-guarded). Lines snapshot the variant's sku/name at
 * creation (historical accuracy). Only the Inventory module writes the ledger.
 */

// ─── Permissions ───────────────────────────────────────────────────────────────
export const RETURN_PERMISSIONS = { view: 'return.view', manage: 'return.manage' } as const;
export type ReturnPermission = (typeof RETURN_PERMISSIONS)[keyof typeof RETURN_PERMISSIONS];

// ─── Enums ─────────────────────────────────────────────────────────────────────
/** Who the goods move between: a `customer` returns to us (inbound); we return to a `supplier` (outbound). */
export const RETURN_KINDS = ['customer', 'supplier'] as const;
export type ReturnKind = (typeof RETURN_KINDS)[number];

export const RETURN_STATUS = ['draft', 'completed', 'cancelled'] as const;
export type ReturnStatus = (typeof RETURN_STATUS)[number];

// ─── Reusable field schemas ──────────────────────────────────────────────────
const objectId = z.string().regex(/^[a-fA-F0-9]{24}$/, 'Must be a 24-character hex id');
const returnQty = z.number().int().min(1, 'Quantity must be at least 1');
const reasonField = z.string().trim().max(500);
const noteField = z.string().trim().max(2000);

// ─── Requests ────────────────────────────────────────────────────────────────
export const ReturnLineInputSchema = z
  .object({
    variantId: objectId,
    quantity: returnQty,
  })
  .strict();
export type ReturnLineInput = z.infer<typeof ReturnLineInputSchema>;

export const CreateReturnRequestSchema = z
  .object({
    kind: z.enum(RETURN_KINDS),
    partyId: objectId,
    locationId: objectId,
    reason: reasonField.optional(),
    note: noteField.optional(),
    lines: z.array(ReturnLineInputSchema).min(1, 'At least one line is required').max(200),
  })
  .strict();
export type CreateReturnRequest = z.infer<typeof CreateReturnRequestSchema>;

/** Update a **draft** return (kind + party are fixed after creation). Replaces the line set. */
export const UpdateReturnRequestSchema = z
  .object({
    locationId: objectId,
    reason: reasonField.nullable(),
    note: noteField.nullable(),
    lines: z.array(ReturnLineInputSchema).min(1).max(200),
  })
  .partial()
  .strict();
export type UpdateReturnRequest = z.infer<typeof UpdateReturnRequestSchema>;

// ─── Responses ───────────────────────────────────────────────────────────────
export const ReturnLineResponseSchema = z.object({
  id: z.string(),
  variantId: z.string(),
  skuSnapshot: z.string(),
  nameSnapshot: z.string(),
  quantity: z.number().int(),
});
export type ReturnLineResponse = z.infer<typeof ReturnLineResponseSchema>;

const returnBase = {
  id: z.string(),
  returnNumber: z.string(),
  kind: z.enum(RETURN_KINDS),
  partyId: z.string(),
  partyName: z.string().nullable(),
  locationId: z.string(),
  status: z.enum(RETURN_STATUS),
  reason: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
};

/** Detail — includes embedded lines + note. */
export const ReturnResponseSchema = z.object({
  ...returnBase,
  note: z.string().nullable(),
  lines: z.array(ReturnLineResponseSchema),
});
export type ReturnResponse = z.infer<typeof ReturnResponseSchema>;

/** List item — omits lines for brevity; carries `lineCount`. */
export const ReturnSummarySchema = z.object({
  ...returnBase,
  lineCount: z.number().int(),
});
export type ReturnSummary = z.infer<typeof ReturnSummarySchema>;

export const ReturnListResponseSchema = z.object({
  data: z.array(ReturnSummarySchema),
  meta: PageMetaSchema,
});
export type ReturnListResponse = z.infer<typeof ReturnListResponseSchema>;

export const ReturnListQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    sort: z.enum(['createdAt', '-createdAt', 'returnNumber', '-returnNumber']).default('-createdAt'),
    kind: z.enum(RETURN_KINDS).optional(),
    status: z.enum(RETURN_STATUS).optional(),
    q: z.string().trim().min(1).max(100).optional(),
  })
  .strict();
export type ReturnListQuery = z.infer<typeof ReturnListQuerySchema>;
