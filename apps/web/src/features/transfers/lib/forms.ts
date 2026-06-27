import { z } from 'zod';
import type { CreateTransferRequest } from '@stockflow/types';

/**
 * Form-shaped schema + helper for a transfer draft. The wire contract lives in `@stockflow/types`; this models
 * human input (string qty, blank = unset). The API re-validates authoritatively.
 */
export const transferLineFormSchema = z.object({
  variantId: z.string().trim().min(1, 'Select a variant'),
  qty: z
    .string()
    .trim()
    .regex(/^\d+$/, 'Whole number')
    .refine((v) => Number(v) >= 1, 'At least 1'),
});
export type TransferLineFormValues = z.infer<typeof transferLineFormSchema>;

export const transferFormSchema = z
  .object({
    sourceLocationId: z.string().trim().min(1, 'Select a source location'),
    destinationLocationId: z.string().trim().min(1, 'Select a destination location'),
    note: z.string().trim().max(2000, 'Note is too long'),
    lines: z.array(transferLineFormSchema).min(1, 'Add at least one line'),
  })
  .refine((v) => v.sourceLocationId === '' || v.sourceLocationId !== v.destinationLocationId, {
    message: 'Source and destination must be different',
    path: ['destinationLocationId'],
  });
export type TransferFormValues = z.infer<typeof transferFormSchema>;

export const emptyTransferLine: TransferLineFormValues = { variantId: '', qty: '1' };

export const emptyTransferForm: TransferFormValues = {
  sourceLocationId: '',
  destinationLocationId: '',
  note: '',
  lines: [{ ...emptyTransferLine }],
};

/** Map the form values to a Create Transfer request. */
export function toCreateTransfer(values: TransferFormValues): CreateTransferRequest {
  const request: CreateTransferRequest = {
    sourceLocationId: values.sourceLocationId.trim(),
    destinationLocationId: values.destinationLocationId.trim(),
    lines: values.lines.map((line) => ({ variantId: line.variantId.trim(), quantity: Number(line.qty) })),
  };
  if (values.note.trim()) request.note = values.note.trim();
  return request;
}
