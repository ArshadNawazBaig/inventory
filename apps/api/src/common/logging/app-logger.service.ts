import type { LoggerService } from '@nestjs/common';
import type { Level, Logger } from 'pino';
import { rootLogger } from './logger';

/**
 * NestJS LoggerService backed by Pino. Registered via `app.useLogger(...)` so the
 * framework's own logs share the structured JSON pipeline. Application code must
 * never use `console.*` — inject this or use a per-request child logger instead.
 */
export class AppLogger implements LoggerService {
  private readonly logger: Logger;

  constructor(context?: string) {
    this.logger = context !== undefined ? rootLogger.child({ context }) : rootLogger;
  }

  private write(level: Level, message: unknown, params: unknown[]): void {
    const [maybeContext] = params;
    const bindings: Record<string, unknown> =
      typeof maybeContext === 'string' ? { context: maybeContext } : {};
    const text = typeof message === 'string' ? message : JSON.stringify(message);
    this.logger[level](bindings, text);
  }

  log(message: unknown, ...params: unknown[]): void {
    this.write('info', message, params);
  }

  error(message: unknown, ...params: unknown[]): void {
    this.write('error', message, params);
  }

  warn(message: unknown, ...params: unknown[]): void {
    this.write('warn', message, params);
  }

  debug(message: unknown, ...params: unknown[]): void {
    this.write('debug', message, params);
  }

  verbose(message: unknown, ...params: unknown[]): void {
    this.write('trace', message, params);
  }
}
