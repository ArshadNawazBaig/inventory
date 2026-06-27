import pino, { type Logger } from 'pino';

/**
 * Root Pino logger. Created before the DI container so framework logs can be
 * routed through the same structured pipeline (see AppLogger / main.ts). The full
 * environment is still validated separately by AppConfigService; the logger only
 * needs the level, which it reads directly so it can exist pre-bootstrap.
 */
export const rootLogger: Logger = pino({
  level: process.env.LOG_LEVEL ?? 'info',
  base: { service: 'stockflow-api' },
  timestamp: pino.stdTimeFunctions.isoTime,
  formatters: {
    level: (label: string) => ({ level: label }),
  },
  // Never log secrets or PII (logging.md). Extend as new sensitive fields appear.
  redact: {
    paths: [
      'req.headers.authorization',
      'req.headers.cookie',
      'password',
      'token',
      'accessToken',
      'refreshToken',
      '*.password',
      '*.token',
      '*.accessToken',
      '*.refreshToken',
    ],
    censor: '[redacted]',
  },
});
