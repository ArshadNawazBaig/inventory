import { z } from 'zod';
import type { CreateAdjustmentRequest } from '@stockflow/types';
import { parseMajorToMinor } from '@/lib/money';

/**
 * Form-shaped schema + mapper for posting a manual stock adjustment. As elsewhere, the wire contract lives
 * in `@stockflow/types`; this models human input (string delta, major-unit cost, blank = unset) and
 * translates to the request. The API re-validates authoritatively.
 */

const optionalMoney = z
  .string()
  .trim()
  .refine((v) => v === '' || /^\d+(\.\d{1,2})?$/.test(v), 'Enter a valid amount (e.g. 12.50)');
const optionalCurrency = z
  .string()
  .trim()
  .refine((v) => v === '' || /^[A-Za-z]{3}$/.test(v), 'ISO-4217 code, e.g. USD');

export const adjustmentFormSchema = z.object({
  variantId: z.string().trim().min(1, 'Select a variant'),
  locationId: z.string().trim().min(1, 'Select a location'),
  delta: z
    .string()
    .trim()
    .regex(/^-?\d+$/, 'Whole number, e.g. 10 or -5')
    .refine((v) => Number(v) !== 0, 'Must be non-zero'),
  note: z.string().trim().max(500, 'Note is too long'),
  unitCost: optionalMoney,
  currency: optionalCurrency,
});
export type AdjustmentFormValues = z.infer<typeof adjustmentFormSchema>;

export const emptyAdjustmentForm: AdjustmentFormValues = {
  variantId: '',
  locationId: '',
  delta: '',
  note: '',
  unitCost: '',
  currency: '',
};

export function toCreateAdjustment(values: AdjustmentFormValues): CreateAdjustmentRequest {
  const delta = Number(values.delta);
  const request: CreateAdjustmentRequest = {
    variantId: values.variantId,
    locationId: values.locationId,
    delta,
  };
  const note = values.note.trim();
  if (note) request.note = note;

  // Unit cost only applies to a positive (inbound) delta — drives weighted-average valuation.
  const cost = values.unitCost.trim() ? parseMajorToMinor(values.unitCost) : null;
  if (cost !== null && delta > 0) {
    request.unitCostMinor = cost;
    const currency = values.currency.trim();
    if (currency) request.currency = currency.toUpperCase();
  }
  return request;
}
