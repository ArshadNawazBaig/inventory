import { Module } from '@nestjs/common';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';
import { ZodValidationPipe } from 'nestjs-zod';
import {
  AllExceptionsFilter,
  AuditInterceptor,
  AuthGuard,
  LoggingInterceptor,
  NotificationInterceptor,
  PermissionGuard,
  TimeoutInterceptor,
} from './common';
import { mongoRoot } from './common/persistence';
import { ConfigModule } from './config';
import { HealthController } from './health/health.controller';
import { AuditModule } from './modules/audit/audit.module';
import { AuthModule } from './modules/auth/auth.module';
import { BillingModule } from './modules/billing/billing.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { CatalogLookupsModule } from './modules/catalog-lookups/catalog-lookups.module';
import { CatalogModule } from './modules/catalog/catalog.module';
import { InventoryModule } from './modules/inventory/inventory.module';
import { LocationsModule } from './modules/locations/locations.module';
import { PartiesModule } from './modules/parties/parties.module';
import { PosModule } from './modules/pos/pos.module';
import { PurchasingModule } from './modules/purchasing/purchasing.module';
import { ReportsModule } from './modules/reports/reports.module';
import { ReturnsModule } from './modules/returns/returns.module';
import { SalesModule } from './modules/sales/sales.module';
import { SettingsModule } from './modules/settings/settings.module';
import { TransfersModule } from './modules/transfers/transfers.module';

/**
 * API root module. Wires the cross-cutting foundation (validated config, global
 * error filter, logging + timeout interceptors, Zod validation, and the auth +
 * RBAC guards) and the business modules.
 */
@Module({
  imports: [
    ConfigModule,
    ...mongoRoot(),
    AuthModule,
    SettingsModule,
    CatalogLookupsModule,
    CatalogModule,
    LocationsModule,
    InventoryModule,
    PartiesModule,
    PurchasingModule,
    SalesModule,
    TransfersModule,
    ReturnsModule,
    PosModule,
    AuditModule,
    NotificationsModule,
    ReportsModule,
    DashboardModule,
    BillingModule,
  ],
  controllers: [HealthController],
  providers: [
    { provide: APP_FILTER, useClass: AllExceptionsFilter },
    { provide: APP_INTERCEPTOR, useClass: LoggingInterceptor },
    { provide: APP_INTERCEPTOR, useClass: TimeoutInterceptor },
    { provide: APP_INTERCEPTOR, useClass: AuditInterceptor },
    { provide: APP_INTERCEPTOR, useClass: NotificationInterceptor },
    { provide: APP_PIPE, useClass: ZodValidationPipe },
    // Guard order matters: authenticate (populate the actor + permissions) before authorizing.
    { provide: APP_GUARD, useClass: AuthGuard },
    { provide: APP_GUARD, useClass: PermissionGuard },
  ],
})
export class AppModule {}
