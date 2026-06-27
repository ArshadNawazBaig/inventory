import type { OrganizationSettingsResponse } from '@stockflow/types';
import type { OrganizationSettingsEntity } from '../domain/entities';

/** Map the domain entity to the API response shape (timestamps as ISO strings; org id stays implicit). */
export function toOrganizationSettingsResponse(
  entity: OrganizationSettingsEntity,
): OrganizationSettingsResponse {
  return {
    defaultCurrency: entity.defaultCurrency,
    timezone: entity.timezone,
    allowNegativeStock: entity.allowNegativeStock,
    lowStockAlertsEnabled: entity.lowStockAlertsEnabled,
    updatedAt: entity.updatedAt ? entity.updatedAt.toISOString() : null,
    updatedBy: entity.updatedBy,
  };
}
