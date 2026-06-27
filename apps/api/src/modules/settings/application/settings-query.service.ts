import { Inject, Injectable } from '@nestjs/common';
import { DEFAULT_ORGANIZATION_SETTINGS } from '@stockflow/types';
import { ORGANIZATION_SETTINGS_REPOSITORY, type OrganizationSettingsRepository } from './ports';

/**
 * The public, read-only query surface other modules use to read tenant policy — the same pattern as
 * InventoryQuery/CatalogQuery. The Inventory module binds its `InventoryPolicyPort` to `allowNegativeStock`
 * (replacing the hardcoded default), so stock policy is now tenant-configurable. Falls back to the safe
 * default when a tenant has never saved settings.
 */
@Injectable()
export class SettingsQuery {
  constructor(
    @Inject(ORGANIZATION_SETTINGS_REPOSITORY) private readonly repo: OrganizationSettingsRepository,
  ) {}

  async allowNegativeStock(organizationId: string): Promise<boolean> {
    const settings = await this.repo.findByOrg(organizationId);
    return settings?.allowNegativeStock ?? DEFAULT_ORGANIZATION_SETTINGS.allowNegativeStock;
  }

  async getDefaultCurrency(organizationId: string): Promise<string> {
    const settings = await this.repo.findByOrg(organizationId);
    return settings?.defaultCurrency ?? DEFAULT_ORGANIZATION_SETTINGS.defaultCurrency;
  }
}
