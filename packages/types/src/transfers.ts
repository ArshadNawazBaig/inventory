import { z } from 'zod';
import { PageMetaSchema } from './catalog';

/**
 * Transfers contracts (inter-location stock moves) — the single source of truth for validation AND types,
 * shared by API + worker + web. See docs/modules/transfers.md and DATABASE §9. A transfer moves stock from a
 * source location to a destination location in two legs: **dispatch posts `transfer_out`** at the source and
 * **receive posts `transfer_in`** at the destination (carrying the source's valuation). Lines snapshot the
 * variant's sku/name at order time (historical accuracy). Only the Inventory module writes the ledger.
 */

// ─── Permissions ───────────────────────────────────────────────────────────────
export const TRANSFER_PERMISSIONS = { view: 'transfer.view', manage: 'transfer.manage' } as const;
export type TransferPermission = (typeof TRANSFER_PERMISSIONS)[keyof typeof TRANSFER_PERMISSIONS];

// ─── Status ──────────────────────────────────────────────────────────────────
export const TRANSFER_STATUS = [
  'draft',
  'in_transit',
  'partially_received',
  'completed',
  'cancelled',
] as const;
export type TransferStatus = (typeof TRANSFER_STATUS)[number];

// ─── Reusable field schemas ──────────────────────────────────────────────────
const objectId = z.string().regex(/^[a-fA-F0-9]{24}$/, 'Must be a 24-character hex id');
const moveQty = z.number().int().min(1, 'Quantity must be at least 1');
const noteField = z.string().trim().max(2000);

// ─── Requests ────────────────────────────────────────────────────────────────
export const TransferLineInputSchema = z
  .object({
    variantId: objectId,
    quantity: moveQty,
  })
  .strict();
export type TransferLineInput = z.infer<typeof TransferLineInputSchema>;

export const CreateTransferRequestSchema = z
  .object({
    sourceLocationId: objectId,
    destinationLocationId: objectId,
    note: noteField.optional(),
    lines: z.array(TransferLineInputSchema).min(1, 'At least one line is required').max(200),
  })
  .strict()
  .refine((value) => value.sourceLocationId !== value.destinationLocationId, {
    message: 'Source and destination must be different locations',
    path: ['destinationLocationId'],
  });
export type CreateTransferRequest = z.infer<typeof CreateTransferRequestSchema>;

/** Update a **draft** transfer. Replaces the line set; source/destination may be repointed while still a draft. */
export const UpdateTransferRequestSchema = z
  .object({
    sourceLocationId: objectId,
    destinationLocationId: objectId,
    note: noteField.nullable(),
    lines: z.array(TransferLineInputSchema).min(1).max(200),
  })
  .partial()
  .strict();
export type UpdateTransferRequest = z.infer<typeof UpdateTransferRequestSchema>;

/** Receive in-transit stock — posts `transfer_in` movements into the transfer's destination and advances status. */
export const ReceiveTransferRequestSchema = z
  .object({
    lines: z
      .array(z.object({ lineId: z.string().min(1), quantity: moveQty }).strict())
      .min(1, 'At least one line is required'),
  })
  .strict();
export type ReceiveTransferRequest = z.infer<typeof ReceiveTransferRequestSchema>;

// ─── Responses ───────────────────────────────────────────────────────────────
export const TransferLineResponseSchema = z.object({
  id: z.string(),
  variantId: z.string(),
  skuSnapshot: z.string(),
  nameSnapshot: z.string(),
  quantity: z.number().int(),
  dispatchedQty: z.number().int(),
  receivedQty: z.number().int(),
  unitCostMinor: z.number().int().nullable(),
});
export type TransferLineResponse = z.infer<typeof TransferLineResponseSchema>;

const transferBase = {
  id: z.string(),
  transferNumber: z.string(),
  sourceLocationId: z.string(),
  sourceLocationName: z.string().nullable(),
  destinationLocationId: z.string(),
  destinationLocationName: z.string().nullable(),
  status: z.enum(TRANSFER_STATUS),
  createdAt: z.string(),
  updatedAt: z.string(),
};

/** Detail — includes embedded lines + note. */
export const TransferResponseSchema = z.object({
  ...transferBase,
  note: z.string().nullable(),
  lines: z.array(TransferLineResponseSchema),
});
export type TransferResponse = z.infer<typeof TransferResponseSchema>;

/** List item — omits lines for brevity; carries `lineCount`. */
export const TransferSummarySchema = z.object({
  ...transferBase,
  lineCount: z.number().int(),
});
export type TransferSummary = z.infer<typeof TransferSummarySchema>;

export const TransferListResponseSchema = z.object({
  data: z.array(TransferSummarySchema),
  meta: PageMetaSchema,
});
export type TransferListResponse = z.infer<typeof TransferListResponseSchema>;

export const TransferListQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    sort: z.enum(['createdAt', '-createdAt', 'transferNumber', '-transferNumber']).default('-createdAt'),
    status: z.enum(TRANSFER_STATUS).optional(),
    q: z.string().trim().min(1).max(100).optional(),
  })
  .strict();
export type TransferListQuery = z.infer<typeof TransferListQuerySchema>;
