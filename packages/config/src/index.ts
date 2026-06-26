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
  MONGODB_URI: z.string().url().optional(),
  REDIS_URL: z.string().url().optional(),
});

export type Env = z.infer<typeof EnvSchema>;

/**
 * Parse + validate environment variables, throwing on invalid config.
 * Pass `process.env` from the calling app (keeps this package runtime-agnostic).
 */
export function loadEnv(source: Record<string, string | undefined>): Env {
  return EnvSchema.parse(source);
}
