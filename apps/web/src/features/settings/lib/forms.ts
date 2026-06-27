import { z } from 'zod';
import type {
  OrganizationSettingsResponse,
  UpdateOrganizationSettingsRequest,
} from '@stockflow/types';

/**
 * Form-shaped schema + mappers for the organization settings. The wire contract lives in `@stockflow/types`;
 * this models the (all-required) form state and translates to/from the API. The API re-validates
 * authoritatively. Currency is normalised to upper-case before sending.
 */

/** A small curated list for the pickers; the API accepts any valid ISO-4217 / IANA value. */
export const CURRENCY_OPTIONS = ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY', 'INR'] as const;
export const TIMEZONE_OPTIONS = [
  'UTC',
  'America/New_York',
  'America/Chicago',
  'America/Los_Angeles',
  'Europe/London',
  'Europe/Berlin',
  'Asia/Dubai',
  'Asia/Kolkata',
  'Asia/Singapore',
  'Australia/Sydney',
] as const;

export const settingsFormSchema = z.object({
  defaultCurrency: z
    .string()
    .trim()
    .regex(/^[A-Za-z]{3}$/, 'ISO-4217 code, e.g. USD'),
  timezone: z
    .string()
    .trim()
    .min(1, 'Select a timezone')
    .regex(/^[A-Za-z][A-Za-z0-9_+/-]*$/, 'Enter a valid timezone'),
  allowNegativeStock: z.boolean(),
  lowStockAlertsEnabled: z.boolean(),
});
export type SettingsFormValues = z.infer<typeof settingsFormSchema>;

/** Build the form's default values from the current settings response. */
export function toSettingsForm(settings: OrganizationSettingsResponse): SettingsFormValues {
  return {
    defaultCurrency: settings.defaultCurrency,
    timezone: settings.timezone,
    allowNegativeStock: settings.allowNegativeStock,
    lowStockAlertsEnabled: settings.lowStockAlertsEnabled,
  };
}

/** Translate the form state into the update request (currency upper-cased). */
export function toUpdateRequest(values: SettingsFormValues): UpdateOrganizationSettingsRequest {
  return {
    defaultCurrency: values.defaultCurrency.trim().toUpperCase(),
    timezone: values.timezone.trim(),
    allowNegativeStock: values.allowNegativeStock,
    lowStockAlertsEnabled: values.lowStockAlertsEnabled,
  };
}
