import { randomBytes } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import { rootLogger } from '../../../common/logging/logger';
import type {
  ResourceClock,
  ResourceEvent,
  ResourceEventPublisher,
  ResourceIdGenerator,
} from '../../../common/resource';

/** ObjectId-shaped id generator (12-byte hex) — matches the `objectId` references PO/SO will use. */
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

/** Logs party domain events via Pino until the event bus / outbox (queues phase) lands. */
@Injectable()
export class LoggingPartyEventPublisher implements ResourceEventPublisher {
  publish(event: ResourceEvent): void {
    rootLogger.info(
      {
        resource: event.resource,
        action: event.action,
        organizationId: event.organizationId,
        entityId: event.entityId,
      },
      'parties:event',
    );
  }
}
