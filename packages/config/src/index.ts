import { z } from 'zod';

/** Application-wide constants. */
export const APP = {
  name: 'StockFlow',
  version: '0.0.0',
} as const;

/**
 * Environment variable schema (single source of truth, validated at boot).
 * Each app loads + validates with `EnvSchema.parse(process.env)`.
 * Extended per phase as integrations are added.
 */
export const EnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  // Cross-cutting runtime/observability config (consumed by the API; harmless to others).
  LOG_LEVEL: z
    .enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent'])
    .default('info'),
  API_PORT: z.coerce.number().int().positive().default(3001),
  /** Comma-separated allow-list of browser origins for CORS (empty = same-origin only). */
  CORS_ORIGINS: z.string().optional(),
  /** Persistence backend: `memory` (in-process, the default) or `mongo` (Mongoose, requires MONGODB_URI). */
  PERSISTENCE_DRIVER: z.enum(['memory', 'mongo']).default('memory'),
  MONGODB_URI: z.string().url().optional(),
  REDIS_URL: z.string().url().optional(),
  /** Auth: session cookie lifetime and invitation token lifetime (days), and the web origin for accept links. */
  SESSION_TTL_DAYS: z.coerce.number().int().positive().default(7),
  INVITATION_TTL_DAYS: z.coerce.number().int().positive().default(7),
  WEB_URL: z.string().url().default('http://localhost:3000'),
});

export type Env = z.infer<typeof EnvSchema>;

/**
 * Parse + validate environment variables, throwing on invalid config.
 * Pass `process.env` from the calling app (keeps this package runtime-agnostic).
 */
export function loadEnv(source: Record<string, string | undefined>): Env {
  return EnvSchema.parse(source);
}
