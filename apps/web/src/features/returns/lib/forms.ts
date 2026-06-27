import { z } from 'zod';
import { RETURN_KINDS, type CreateReturnRequest } from '@stockflow/types';

/**
 * Form-shaped schema + helper for a return draft. The wire contract lives in `@stockflow/types`; this models
 * human input (string qty, blank = unset). The API re-validates authoritatively.
 */
export const returnLineFormSchema = z.object({
  variantId: z.string().trim().min(1, 'Select a variant'),
  qty: z
    .string()
    .trim()
    .regex(/^\d+$/, 'Whole number')
    .refine((v) => Number(v) >= 1, 'At least 1'),
});
export type ReturnLineFormValues = z.infer<typeof returnLineFormSchema>;

export const returnFormSchema = z.object({
  kind: z.enum(RETURN_KINDS),
  partyId: z.string().trim().min(1, 'Select one'),
  locationId: z.string().trim().min(1, 'Select a location'),
  reason: z.string().trim().max(500, 'Reason is too long'),
  note: z.string().trim().max(2000, 'Note is too long'),
  lines: z.array(returnLineFormSchema).min(1, 'Add at least one line'),
});
export type ReturnFormValues = z.infer<typeof returnFormSchema>;

export const emptyReturnLine: ReturnLineFormValues = { variantId: '', qty: '1' };

export const emptyReturnForm: ReturnFormValues = {
  kind: 'customer',
  partyId: '',
  locationId: '',
  reason: '',
  note: '',
  lines: [{ ...emptyReturnLine }],
};

/** Map the form values to a Create Return request. */
export function toCreateReturn(values: ReturnFormValues): CreateReturnRequest {
  const request: CreateReturnRequest = {
    kind: values.kind,
    partyId: values.partyId.trim(),
    locationId: values.locationId.trim(),
    lines: values.lines.map((line) => ({ variantId: line.variantId.trim(), quantity: Number(line.qty) })),
  };
  if (values.reason.trim()) request.reason = values.reason.trim();
  if (values.note.trim()) request.note = values.note.trim();
  return request;
}
