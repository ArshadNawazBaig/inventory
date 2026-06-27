import { z } from 'zod';
import { parseMajorToMinor } from '@/lib/money';

/**
 * Shared form-shaped schema + helpers for an order draft (Purchasing + Sales). The wire contracts live in
 * `@stockflow/types`; this models human input (string qty, major-unit money, blank = unset). Each module
 * maps the shared shape to its own request (unit cost vs unit price). The API re-validates authoritatively.
 */

export const orderLineFormSchema = z.object({
  variantId: z.string().trim().min(1, 'Select a variant'),
  qty: z
    .string()
    .trim()
    .regex(/^\d+$/, 'Whole number')
    .refine((v) => Number(v) >= 1, 'At least 1'),
  unitMajor: z
    .string()
    .trim()
    .regex(/^\d+(\.\d{1,2})?$/, 'Enter an amount (e.g. 12.50)'),
});
export type OrderLineFormValues = z.infer<typeof orderLineFormSchema>;

export const orderFormSchema = z.object({
  partyId: z.string().trim().min(1, 'Select one'),
  warehouseId: z.string().trim().min(1, 'Select a warehouse'),
  currency: z
    .string()
    .trim()
    .regex(/^[A-Za-z]{3}$/, 'ISO-4217 code, e.g. USD'),
  expectedAt: z
    .string()
    .trim()
    .refine((v) => v === '' || /^\d{4}-\d{2}-\d{2}$/.test(v), 'Date as YYYY-MM-DD'),
  note: z.string().trim().max(2000, 'Note is too long'),
  lines: z.array(orderLineFormSchema).min(1, 'Add at least one line'),
});
export type OrderFormValues = z.infer<typeof orderFormSchema>;

export const emptyOrderLine: OrderLineFormValues = { variantId: '', qty: '1', unitMajor: '0.00' };

export const emptyOrderForm: OrderFormValues = {
  partyId: '',
  warehouseId: '',
  currency: 'USD',
  expectedAt: '',
  note: '',
  lines: [{ ...emptyOrderLine }],
};

/** The shared per-line fields, parsed to numbers; each module renames `unitMinor` (cost vs price). */
export function toLineCore(line: OrderLineFormValues): {
  variantId: string;
  orderedQty: number;
  unitMinor: number;
} {
  return {
    variantId: line.variantId.trim(),
    orderedQty: Number(line.qty),
    unitMinor: parseMajorToMinor(line.unitMajor) ?? 0,
  };
}
