import { Module } from '@nestjs/common';
import { mongoFeature, repositoryProvider } from '../../common/persistence';
import { SystemClock, type ResourceClock } from '../../common/resource';
import {
  ORGANIZATION_SETTINGS_REPOSITORY,
  SETTINGS_CLOCK,
  type OrganizationSettingsRepository,
} from './application/ports';
import { SettingsService } from './application/settings.service';
import { SettingsQuery } from './application/settings-query.service';
import { InMemoryOrganizationSettingsRepository } from './infrastructure/in-memory.repository';
import { MongoOrganizationSettingsRepository } from './infrastructure/mongoose/mongo.repository';
import {
  ORGANIZATION_SETTINGS_MODEL,
  OrganizationSettingsSchema,
} from './infrastructure/mongoose/schemas';
import { SettingsController } from './presentation/settings.controller';

/**
 * Settings module — the organization-settings singleton. Owns tenant preferences and the
 * `allowNegativeStock` policy the Inventory ledger enforces. Depends on nothing (no cycles); exports
 * `SettingsQuery` so Inventory can bind its policy port to it. Ports bound to in-memory adapters until the
 * database module lands.
 */
@Module({
  imports: [
    ...mongoFeature([{ name: ORGANIZATION_SETTINGS_MODEL, schema: OrganizationSettingsSchema }]),
  ],
  controllers: [SettingsController],
  providers: [
    repositoryProvider(
      ORGANIZATION_SETTINGS_REPOSITORY,
      InMemoryOrganizationSettingsRepository,
      MongoOrganizationSettingsRepository,
    ),
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
