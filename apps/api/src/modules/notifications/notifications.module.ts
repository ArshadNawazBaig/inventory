import { Module } from '@nestjs/common';
import { NOTIFIER } from '../../common/notifications/notifier';
import {
  ObjectIdGenerator,
  SystemClock,
  type ResourceClock,
  type ResourceIdGenerator,
} from '../../common/resource';
import {
  NOTIFICATION_CLOCK,
  NOTIFICATION_ID_GENERATOR,
  NOTIFICATION_REPOSITORY,
  type NotificationRepository,
} from './application/ports';
import { NotificationService } from './application/notification.service';
import { InMemoryNotificationRepository } from './infrastructure/in-memory.repository';
import { NotificationController } from './presentation/notification.controller';

/**
 * Notifications module — owns the per-recipient in-app inbox. Provides the recipient read/manage API and binds
 * the cross-cutting `NOTIFIER` port (consumed by the global `NotificationInterceptor` in app.module) to its
 * `NotificationService`. Depends on no domain module → strictly one-way, no cycles.
 */
@Module({
  controllers: [NotificationController],
  providers: [
    { provide: NOTIFICATION_REPOSITORY, useClass: InMemoryNotificationRepository },
    { provide: NOTIFICATION_ID_GENERATOR, useValue: new ObjectIdGenerator() },
    { provide: NOTIFICATION_CLOCK, useValue: new SystemClock() },
    {
      provide: NotificationService,
      inject: [NOTIFICATION_REPOSITORY, NOTIFICATION_ID_GENERATOR, NOTIFICATION_CLOCK],
      useFactory: (
        repo: NotificationRepository,
        ids: ResourceIdGenerator,
        clock: ResourceClock,
      ): NotificationService => new NotificationService(repo, ids, clock),
    },
    { provide: NOTIFIER, useExisting: NotificationService },
  ],
  exports: [NOTIFIER],
})
export class NotificationsModule {}
