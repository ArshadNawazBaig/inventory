import type { Env } from '@stockflow/config';

/**
 * Typed accessor over the validated environment. Constructed once at boot from
 * `loadEnv(process.env)` (see ConfigModule), so by the time any provider reads it
 * the configuration is guaranteed valid — fail-fast on missing/invalid env.
 */
export class AppConfigService {
  constructor(private readonly env: Env) {}

  get nodeEnv(): Env['NODE_ENV'] {
    return this.env.NODE_ENV;
  }

  get isProduction(): boolean {
    return this.env.NODE_ENV === 'production';
  }

  get logLevel(): Env['LOG_LEVEL'] {
    return this.env.LOG_LEVEL;
  }

  get apiPort(): number {
    return this.env.API_PORT;
  }

  /** Parsed CORS allow-list (empty array = same-origin only). */
  get corsOrigins(): string[] {
    if (this.env.CORS_ORIGINS === undefined) {
      return [];
    }
    return this.env.CORS_ORIGINS.split(',')
      .map((origin) => origin.trim())
      .filter((origin) => origin.length > 0);
  }

  get persistenceDriver(): Env['PERSISTENCE_DRIVER'] {
    return this.env.PERSISTENCE_DRIVER;
  }

  get mongoUri(): string | undefined {
    return this.env.MONGODB_URI;
  }

  get redisUrl(): string | undefined {
    return this.env.REDIS_URL;
  }
}
