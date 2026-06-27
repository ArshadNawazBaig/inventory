import { Module } from '@nestjs/common';
import { SystemClock, type ResourceClock } from '../../common/resource';
import { CatalogModule } from '../catalog/catalog.module';
import { CatalogQuery } from '../catalog/application/catalog-query.service';
import { LocationsModule } from '../locations/locations.module';
import { LocationQuery } from '../locations/application/location-query.service';
import {
  BILLING_CATALOG,
  BILLING_CLOCK,
  BILLING_LOCATION,
  BILLING_PROVIDER,
  SUBSCRIPTION_REPOSITORY,
  type BillingCatalogPort,
  type BillingLocationPort,
  type BillingProviderPort,
  type SubscriptionRepository,
} from './application/ports';
import { BillingService } from './application/billing.service';
import { BillingQuery } from './application/billing-query.service';
import { FakeBillingProvider } from './infrastructure/adapters';
import { InMemorySubscriptionRepository } from './infrastructure/in-memory.repository';
import { BillingController } from './presentation/billing.controller';

/**
 * Billing module — the tenant subscription against the fixed plan catalog. Payment is abstracted behind
 * `BillingProviderPort` (a fake provider now; Stripe later). Depends one-way on Catalog + Locations (usage
 * counts), bound by identity to their query services — no writes there, no cycles. Exports `BillingQuery`
 * (entitlements) for future quota enforcement.
 */
@Module({
  imports: [CatalogModule, LocationsModule],
  controllers: [BillingController],
  providers: [
    { provide: SUBSCRIPTION_REPOSITORY, useClass: InMemorySubscriptionRepository },
    { provide: BILLING_PROVIDER, useClass: FakeBillingProvider },
    { provide: BILLING_CLOCK, useValue: new SystemClock() },
    {
      provide: BILLING_CATALOG,
      inject: [CatalogQuery],
      useFactory: (catalog: CatalogQuery): BillingCatalogPort => catalog,
    },
    {
      provide: BILLING_LOCATION,
      inject: [LocationQuery],
      useFactory: (locations: LocationQuery): BillingLocationPort => locations,
    },
    {
      provide: BillingService,
      inject: [SUBSCRIPTION_REPOSITORY, BILLING_PROVIDER, BILLING_CATALOG, BILLING_LOCATION, BILLING_CLOCK],
      useFactory: (
        repo: SubscriptionRepository,
        provider: BillingProviderPort,
        catalog: BillingCatalogPort,
        locations: BillingLocationPort,
        clock: ResourceClock,
      ): BillingService => new BillingService(repo, provider, catalog, locations, clock),
    },
    BillingQuery,
  ],
  exports: [BillingQuery],
})
export class BillingModule {}
