import { describe, it, expect } from 'vitest';
import {
  DEFAULT_ORGANIZATION_SETTINGS,
  OrganizationSettingsResponseSchema,
  SETTINGS_PERMISSIONS,
  UpdateOrganizationSettingsRequestSchema,
} from '@stockflow/types';

describe('Settings contracts', () => {
  it('exposes view + manage permission keys', () => {
    expect(SETTINGS_PERMISSIONS).toEqual({ view: 'settings.view', manage: 'settings.manage' });
  });

  it('ships safe defaults', () => {
    expect(DEFAULT_ORGANIZATION_SETTINGS).toEqual({
      defaultCurrency: 'USD',
      timezone: 'UTC',
      allowNegativeStock: false,
      lowStockAlertsEnabled: true,
    });
  });

  it('accepts a well-formed settings response (nullable timestamps)', () => {
    const ok = OrganizationSettingsResponseSchema.safeParse({
      defaultCurrency: 'USD',
      timezone: 'UTC',
      allowNegativeStock: false,
      lowStockAlertsEnabled: true,
      updatedAt: null,
      updatedBy: null,
    });
    expect(ok.success).toBe(true);
  });

  it('accepts a partial update with a single field', () => {
    expect(UpdateOrganizationSettingsRequestSchema.safeParse({ allowNegativeStock: true }).success).toBe(true);
    expect(UpdateOrganizationSettingsRequestSchema.safeParse({ timezone: 'America/New_York' }).success).toBe(true);
  });

  it('rejects an empty patch', () => {
    expect(UpdateOrganizationSettingsRequestSchema.safeParse({}).success).toBe(false);
  });

  it('rejects an invalid currency code', () => {
    expect(UpdateOrganizationSettingsRequestSchema.safeParse({ defaultCurrency: 'usd' }).success).toBe(false);
    expect(UpdateOrganizationSettingsRequestSchema.safeParse({ defaultCurrency: 'US' }).success).toBe(false);
  });

  it('rejects a malformed timezone and unknown fields', () => {
    expect(UpdateOrganizationSettingsRequestSchema.safeParse({ timezone: '123bad' }).success).toBe(false);
    expect(UpdateOrganizationSettingsRequestSchema.safeParse({ nope: true }).success).toBe(false);
  });
});
