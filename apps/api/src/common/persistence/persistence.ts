import { type Provider, type Type } from '@nestjs/common';
import { type DynamicModule } from '@nestjs/common';
import { MongooseModule, type ModelDefinition } from '@nestjs/mongoose';

/**
 * Persistence driver switch. Every repository binds through a port (a Symbol token); this picks the concrete
 * adapter — the in-process **memory** store (default) or the **mongo** (Mongoose) adapter — without the
 * application layer ever knowing. Set `PERSISTENCE_DRIVER=mongo` (+ `MONGODB_URI`) to run on MongoDB.
 *
 * The driver is read from `process.env` directly because module metadata (imports/providers) is evaluated at
 * import time, before any provider — including AppConfigService — is instantiated. The value is still
 * validated at boot by `loadEnv`; this read only chooses wiring.
 */
export type PersistenceDriver = 'memory' | 'mongo';

export function persistenceDriver(): PersistenceDriver {
  return process.env.PERSISTENCE_DRIVER === 'mongo' ? 'mongo' : 'memory';
}

export function isMongo(): boolean {
  return persistenceDriver() === 'mongo';
}

/**
 * Bind a repository token to the mongo adapter in mongo mode, else the in-memory one. The signature forces
 * both adapters to exist for every port, keeping the two drivers in lock-step.
 */
export function repositoryProvider(token: symbol, memory: Type, mongo: Type): Provider {
  return { provide: token, useClass: isMongo() ? mongo : memory };
}

/**
 * `MongooseModule.forFeature(models)` in mongo mode (registers the schemas for this module); an empty list in
 * memory mode (no connection, no models). Spread into a module's `imports`.
 */
export function mongoFeature(models: ModelDefinition[]): DynamicModule[] {
  return isMongo() ? [MongooseModule.forFeature(models)] : [];
}
