import { Module } from '@nestjs/common';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';
import { ZodValidationPipe } from 'nestjs-zod';
import {
  AllExceptionsFilter,
  AuditInterceptor,
  DevAuthGuard,
  LoggingInterceptor,
  TimeoutInterceptor,
} from './common';
import { ConfigModule } from './config';
import { HealthController } from './health/health.controller';
import { AuditModule } from './modules/audit/audit.module';
import { CatalogLookupsModule } from './modules/catalog-lookups/catalog-lookups.module';
import { CatalogModule } from './modules/catalog/catalog.module';
import { InventoryModule } from './modules/inventory/inventory.module';
import { LocationsModule } from './modules/locations/locations.module';
import { PartiesModule } from './modules/parties/parties.module';
import { PurchasingModule } from './modules/purchasing/purchasing.module';
import { ReturnsModule } from './modules/returns/returns.module';
import { SalesModule } from './modules/sales/sales.module';
import { TransfersModule } from './modules/transfers/transfers.module';

/**
 * API root module. Wires the cross-cutting foundation (validated config, global
 * error filter, logging + timeout interceptors, Zod validation, dev tenant guard)
 * and the business modules.
 */
@Module({
  imports: [
    ConfigModule,
    CatalogLookupsModule,
    CatalogModule,
    LocationsModule,
    InventoryModule,
    PartiesModule,
    PurchasingModule,
    SalesModule,
    TransfersModule,
    ReturnsModule,
    AuditModule,
  ],
  controllers: [HealthController],
  providers: [
    { provide: APP_FILTER, useClass: AllExceptionsFilter },
    { provide: APP_INTERCEPTOR, useClass: LoggingInterceptor },
    { provide: APP_INTERCEPTOR, useClass: TimeoutInterceptor },
    { provide: APP_INTERCEPTOR, useClass: AuditInterceptor },
    { provide: APP_PIPE, useClass: ZodValidationPipe },
    { provide: APP_GUARD, useClass: DevAuthGuard },
  ],
})
export class AppModule {}
