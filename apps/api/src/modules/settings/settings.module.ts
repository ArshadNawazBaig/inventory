import { Module } from '@nestjs/common';
import { SystemClock, type ResourceClock } from '../../common/resource';
import {
  ORGANIZATION_SETTINGS_REPOSITORY,
  SETTINGS_CLOCK,
  type OrganizationSettingsRepository,
} from './application/ports';
import { SettingsService } from './application/settings.service';
import { SettingsQuery } from './application/settings-query.service';
import { InMemoryOrganizationSettingsRepository } from './infrastructure/in-memory.repository';
import { SettingsController } from './presentation/settings.controller';

/**
 * Settings module — the organization-settings singleton. Owns tenant preferences and the
 * `allowNegativeStock` policy the Inventory ledger enforces. Depends on nothing (no cycles); exports
 * `SettingsQuery` so Inventory can bind its policy port to it. Ports bound to in-memory adapters until the
 * database module lands.
 */
@Module({
  controllers: [SettingsController],
  providers: [
    { provide: ORGANIZATION_SETTINGS_REPOSITORY, useClass: InMemoryOrganizationSettingsRepository },
    { provide: SETTINGS_CLOCK, useValue: new SystemClock() },
    {
      provide: SettingsService,
      inject: [ORGANIZATION_SETTINGS_REPOSITORY, SETTINGS_CLOCK],
      useFactory: (repo: OrganizationSettingsRepository, clock: ResourceClock): SettingsService =>
        new SettingsService(repo, clock),
    },
    SettingsQuery,
  ],
  exports: [SettingsQuery],
})
export class SettingsModule {}
