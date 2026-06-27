import { Module } from '@nestjs/common';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';
import { ZodValidationPipe } from 'nestjs-zod';
import {
  AllExceptionsFilter,
  DevAuthGuard,
  LoggingInterceptor,
  TimeoutInterceptor,
} from './common';
import { ConfigModule } from './config';
import { HealthController } from './health/health.controller';
import { CatalogModule } from './modules/catalog/catalog.module';

/**
 * API root module. Wires the cross-cutting foundation (validated config, global
 * error filter, logging + timeout interceptors, Zod validation, dev tenant guard)
 * and the business modules.
 */
@Module({
  imports: [ConfigModule, CatalogModule],
  controllers: [HealthController],
  providers: [
    { provide: APP_FILTER, useClass: AllExceptionsFilter },
    { provide: APP_INTERCEPTOR, useClass: LoggingInterceptor },
    { provide: APP_INTERCEPTOR, useClass: TimeoutInterceptor },
    { provide: APP_PIPE, useClass: ZodValidationPipe },
    { provide: APP_GUARD, useClass: DevAuthGuard },
  ],
})
export class AppModule {}
