import { z } from 'zod';

/**
 * Settings contracts — the single source of truth for validation AND types, shared by API + worker + web.
 * See docs/modules/settings.md. Settings is an **organization singleton** (one document per tenant) holding
 * operational preferences. Notably it owns `allowNegativeStock`, the policy the Inventory ledger enforces.
 */

// ─── Permissions ───────────────────────────────────────────────────────────────
export const SETTINGS_PERMISSIONS = { view: 'settings.view', manage: 'settings.manage' } as const;
export type SettingsPermission = (typeof SETTINGS_PERMISSIONS)[keyof typeof SETTINGS_PERMISSIONS];

// ─── Field schemas ───────────────────────────────────────────────────────────
const currencyField = z.string().regex(/^[A-Z]{3}$/, 'ISO-4217 currency code (e.g. USD)');
/** IANA-style timezone label ("UTC", "America/New_York"); loose-validated (not the full tz database). */
const timezoneField = z
  .string()
  .trim()
  .min(1)
  .max(64)
  .regex(/^[A-Za-z][A-Za-z0-9_+/-]*$/, 'Must be a timezone label (e.g. UTC or America/New_York)');

// ─── Defaults (the safe baseline a never-saved tenant gets) ────────────────────
export const DEFAULT_ORGANIZATION_SETTINGS = {
  defaultCurrency: 'USD',
  timezone: 'UTC',
  allowNegativeStock: false,
  lowStockAlertsEnabled: true,
} as const;

// ─── Response ──────────────────────────────────────────────────────────────────
export const OrganizationSettingsResponseSchema = z.object({
  defaultCurrency: z.string(),
  timezone: z.string(),
  /** When true, the ledger permits on-hand to go below zero (otherwise shipments/removals are guarded). */
  allowNegativeStock: z.boolean(),
  /** When true, low-stock notifications are emitted (delivery wired with the notification fan-out). */
  lowStockAlertsEnabled: z.boolean(),
  updatedAt: z.string().nullable(),
  updatedBy: z.string().nullable(),
});
export type OrganizationSettingsResponse = z.infer<typeof OrganizationSettingsResponseSchema>;

// ─── Update (partial; at least one field) ──────────────────────────────────────
export const UpdateOrganizationSettingsRequestSchema = z
  .object({
    defaultCurrency: currencyField,
    timezone: timezoneField,
    allowNegativeStock: z.boolean(),
    lowStockAlertsEnabled: z.boolean(),
  })
  .partial()
  .strict()
  .refine((value) => Object.keys(value).length > 0, {
    message: 'Provide at least one field to update',
  });
export type UpdateOrganizationSettingsRequest = z.infer<typeof UpdateOrganizationSettingsRequestSchema>;
