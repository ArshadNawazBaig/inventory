import type { OrganizationSettingsEntity } from '../domain/entities';

/**
 * Persistence port for the organization-settings singleton. Tenant-scoped by `organizationId` (the identity).
 * The Mongoose adapter implements the same port (one doc per org, upserted) without touching the application.
 */
export interface OrganizationSettingsRepository {
  findByOrg(organizationId: string): Promise<OrganizationSettingsEntity | null>;
  upsert(settings: OrganizationSettingsEntity): Promise<OrganizationSettingsEntity>;
}

// ─── DI tokens (framework-agnostic symbols; wired in settings.module.ts) ──────────
export const ORGANIZATION_SETTINGS_REPOSITORY = Symbol('OrganizationSettingsRepository');
export const SETTINGS_CLOCK = Symbol('SettingsClock');
