import { randomBytes } from 'node:crypto';
import { rootLogger } from '../logging/logger';
import type { ResourceEvent } from './resource.entity';
import type {
  ResourceClock,
  ResourceEventPublisher,
  ResourceIdGenerator,
} from './resource.ports';

/**
 * Shared infrastructure adapters for the managed-resource family. Framework-free (no NestJS imports) so
 * they stay testable in isolation; modules bind them via `useValue`/`useClass` (they take no DI deps).
 * The real Mongo ObjectId generator and a queue/outbox publisher replace these with the DB + queues phases.
 */

/**
 * ObjectId-shaped id generator: 12 random bytes → 24-char hex, matching the `objectId` contract used by
 * reference fields across the system (a product's `baseUnitId`, a category's `parentId`, a location's
 * `warehouseId`/`parentLocationId`). UUIDs would fail those 24-hex validators.
 */
export class ObjectIdGenerator implements ResourceIdGenerator {
  generate(): string {
    return randomBytes(12).toString('hex');
  }
}

/** Wall-clock source; isolated behind a port so services stay deterministic under test. */
export class SystemClock implements ResourceClock {
  now(): Date {
    return new Date();
  }
}

/**
 * Logs resource domain events via Pino under a per-module channel until the event bus / outbox (queues
 * phase) lands. One class, parameterised by channel — `new LoggingResourceEventPublisher('parties:event')`.
 */
export class LoggingResourceEventPublisher implements ResourceEventPublisher {
  constructor(private readonly channel: string) {}

  publish(event: ResourceEvent): void {
    rootLogger.info(
      {
        resource: event.resource,
        action: event.action,
        organizationId: event.organizationId,
        entityId: event.entityId,
      },
      this.channel,
    );
  }
}
