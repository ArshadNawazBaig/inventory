import { Schema } from 'mongoose';

/**
 * Mongoose schema for the organization-settings **singleton** — one document per tenant. The tenant is the
 * identity, so **`_id` is the `organizationId`** (a string); there is no separate id field and no second
 * organizationId column — the `_id` is the single source of truth, reconstructed by the mapper. `versionKey`
 * is off. Timestamps are nullable (a GET returns ephemeral defaults without persisting; they are set on first
 * save).
 */

export const ORGANIZATION_SETTINGS_MODEL = 'OrganizationSettings';

/** The stored settings document — the entity shape with `organizationId` carried by `_id`. */
export interface OrganizationSettingsDoc {
  _id: string; // = organizationId
  defaultCurrency: string;
  timezone: string;
  allowNegativeStock: boolean;
  lowStockAlertsEnabled: boolean;
  createdAt: Date | null;
  updatedAt: Date | null;
  updatedBy: string | null;
}

export const OrganizationSettingsSchema = new Schema<OrganizationSettingsDoc>(
  {
    _id: { type: String },
    defaultCurrency: { type: String, required: true },
    timezone: { type: String, required: true },
    allowNegativeStock: { type: Boolean, required: true },
    lowStockAlertsEnabled: { type: Boolean, required: true },
    createdAt: { type: Date, default: null },
    updatedAt: { type: Date, default: null },
    updatedBy: { type: String, default: null },
  },
  { collection: 'organization_settings', versionKey: false },
);
