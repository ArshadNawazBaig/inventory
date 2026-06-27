import { DEFAULT_ORGANIZATION_SETTINGS, type UpdateOrganizationSettingsRequest } from '@stockflow/types';
import type { ActorContext } from '../../../common/auth/actor-context';
import type { ResourceClock } from '../../../common/resource';
import type { OrganizationSettingsEntity } from '../domain/entities';
import type { OrganizationSettingsRepository } from './ports';

/**
 * Settings use cases for the organization singleton. `get` returns the persisted settings or **ephemeral
 * defaults** (a read never writes); `update` merges a partial patch onto the current-or-default state and
 * upserts. `allowNegativeStock` here is the policy the Inventory ledger enforces — see `SettingsQuery`.
 */
export class SettingsService {
  constructor(
    private readonly repo: OrganizationSettingsRepository,
    private readonly clock: ResourceClock,
  ) {}

  /** The tenant's settings, or safe defaults if never saved (not persisted — a GET has no side effects). */
  async get(ctx: ActorContext): Promise<OrganizationSettingsEntity> {
    const existing = await this.repo.findByOrg(ctx.organizationId);
    return existing ?? this.defaults(ctx.organizationId);
  }

  /** Merge a partial patch onto the current-or-default settings and persist. */
  async update(
    ctx: ActorContext,
    patch: UpdateOrganizationSettingsRequest,
  ): Promise<OrganizationSettingsEntity> {
    const current = (await this.repo.findByOrg(ctx.organizationId)) ?? this.defaults(ctx.organizationId);
    const now = this.clock.now();
    const next: OrganizationSettingsEntity = {
      organizationId: current.organizationId,
      defaultCurrency: patch.defaultCurrency ?? current.defaultCurrency,
      timezone: patch.timezone ?? current.timezone,
      allowNegativeStock: patch.allowNegativeStock ?? current.allowNegativeStock,
      lowStockAlertsEnabled: patch.lowStockAlertsEnabled ?? current.lowStockAlertsEnabled,
      createdAt: current.createdAt ?? now,
      updatedAt: now,
      updatedBy: ctx.actorId,
    };
    return this.repo.upsert(next);
  }

  private defaults(organizationId: string): OrganizationSettingsEntity {
    return {
      organizationId,
      ...DEFAULT_ORGANIZATION_SETTINGS,
      createdAt: null,
      updatedAt: null,
      updatedBy: null,
    };
  }
}
