import { Injectable } from '@nestjs/common';
import type { OrganizationSettingsEntity } from '../domain/entities';
import type { OrganizationSettingsRepository } from '../application/ports';

/**
 * In-memory organization-settings store — the runnable, fully-testable persistence until the database module
 * lands. One row per tenant, keyed by `organizationId`. The Mongoose adapter implements the same port
 * (an upsert on `{ organizationId }`) and drops in unchanged.
 */
@Injectable()
export class InMemoryOrganizationSettingsRepository implements OrganizationSettingsRepository {
  private readonly store = new Map<string, OrganizationSettingsEntity>();

  findByOrg(organizationId: string): Promise<OrganizationSettingsEntity | null> {
    const found = this.store.get(organizationId);
    return Promise.resolve(found ? { ...found } : null);
  }

  upsert(settings: OrganizationSettingsEntity): Promise<OrganizationSettingsEntity> {
    this.store.set(settings.organizationId, { ...settings });
    return Promise.resolve({ ...settings });
  }
}
