import { randomBytes } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import { rootLogger } from '../../../common/logging/logger';
import type {
  ResourceClock,
  ResourceEvent,
  ResourceEventPublisher,
  ResourceIdGenerator,
} from '../../../common/resource';

/**
 * ObjectId-shaped id generator: 12 random bytes → 24-char hex, matching the `objectId` contract used by
 * reference fields (a product's `baseUnitId`/`categoryId`, a category's `parentId`). The real Mongo
 * ObjectId generator replaces this with the DB module. (UUIDs would fail those 24-hex validators.)
 */
@Injectable()
export class ObjectIdGenerator implements ResourceIdGenerator {
  generate(): string {
    return randomBytes(12).toString('hex');
  }
}

@Injectable()
export class SystemClock implements ResourceClock {
  now(): Date {
    return new Date();
  }
}

/** Logs lookup domain events via Pino until the event bus / outbox (queues phase) lands. */
@Injectable()
export class LoggingLookupEventPublisher implements ResourceEventPublisher {
  publish(event: ResourceEvent): void {
    rootLogger.info(
      {
        resource: event.resource,
        action: event.action,
        organizationId: event.organizationId,
        entityId: event.entityId,
      },
      'catalog-lookups:event',
    );
  }
}
