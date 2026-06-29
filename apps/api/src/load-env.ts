import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

/**
 * Load the nearest `.env` into `process.env` **before anything else is imported**.
 *
 * Why a dedicated first-import module: the persistence driver switch (and the module decorators that call it)
 * reads `process.env.PERSISTENCE_DRIVER` at **import time** — so the env must be populated before the Nest
 * module graph is required. `main.ts` imports this file first to guarantee that ordering.
 *
 * Walks up from the working directory so it works whether the process starts at the repo root or in `apps/api`.
 * Uses Node's built-in env-file loader (Node ≥ 20.12) — no dependency. Variables already present in the real
 * environment win (the loader does not overwrite them), so container/CI config still takes precedence.
 */
function findEnvFile(): string | undefined {
  let dir = process.cwd();
  for (let depth = 0; depth < 6; depth += 1) {
    const candidate = resolve(dir, '.env');
    if (existsSync(candidate)) return candidate;
    const parent = dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return undefined;
}

const envFile = findEnvFile();
if (envFile) {
  process.loadEnvFile(envFile);
}
