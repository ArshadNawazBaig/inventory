import { describe, it, expect } from 'vitest';
import type { OrganizationSettingsResponse } from '@stockflow/types';
import { settingsFormSchema, toSettingsForm, toUpdateRequest } from './forms';

const response: OrganizationSettingsResponse = {
  defaultCurrency: 'EUR',
  timezone: 'Europe/London',
  allowNegativeStock: true,
  lowStockAlertsEnabled: false,
  updatedAt: '2026-06-28T09:00:00.000Z',
  updatedBy: 'user-ann',
};

describe('toSettingsForm', () => {
  it('projects the response onto the form fields', () => {
    expect(toSettingsForm(response)).toEqual({
      defaultCurrency: 'EUR',
      timezone: 'Europe/London',
      allowNegativeStock: true,
      lowStockAlertsEnabled: false,
    });
  });
});

describe('toUpdateRequest', () => {
  it('upper-cases the currency and trims the timezone', () => {
    const req = toUpdateRequest({
      defaultCurrency: 'gbp',
      timezone: '  UTC  ',
      allowNegativeStock: false,
      lowStockAlertsEnabled: true,
    });
    expect(req).toEqual({
      defaultCurrency: 'GBP',
      timezone: 'UTC',
      allowNegativeStock: false,
      lowStockAlertsEnabled: true,
    });
  });
});

describe('settingsFormSchema', () => {
  it('rejects a malformed currency', () => {
    expect(settingsFormSchema.safeParse({ ...toSettingsForm(response), defaultCurrency: 'EU' }).success).toBe(false);
  });
  it('accepts a valid form', () => {
    expect(settingsFormSchema.safeParse(toSettingsForm(response)).success).toBe(true);
  });
});
