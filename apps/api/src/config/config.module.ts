import { Global, Module } from '@nestjs/common';
import { loadEnv } from '@stockflow/config';
import { AppConfigService } from './config.service';

/**
 * Global configuration module. Validates the environment once at startup and
 * exposes {@link AppConfigService}. Any invalid/missing variable throws here,
 * before the app accepts traffic (fail-fast).
 */
@Global()
@Module({
  providers: [
    {
      provide: AppConfigService,
      useFactory: (): AppConfigService => new AppConfigService(loadEnv(process.env)),
    },
  ],
  exports: [AppConfigService],
})
export class ConfigModule {}
