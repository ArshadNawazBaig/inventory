import { Module } from '@nestjs/common';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { AllExceptionsFilter, LoggingInterceptor, TimeoutInterceptor } from './common';
import { ConfigModule } from './config';
import { HealthController } from './health/health.controller';

/**
 * API root module. Wires the cross-cutting foundation: validated config, a global
 * error filter (one error envelope), and global logging + timeout interceptors.
 * Business modules (Catalog, Inventory, …) are registered here in later phases.
 */
@Module({
  imports: [ConfigModule],
  controllers: [HealthController],
  providers: [
    { provide: APP_FILTER, useClass: AllExceptionsFilter },
    { provide: APP_INTERCEPTOR, useClass: LoggingInterceptor },
    { provide: APP_INTERCEPTOR, useClass: TimeoutInterceptor },
  ],
})
export class AppModule {}
