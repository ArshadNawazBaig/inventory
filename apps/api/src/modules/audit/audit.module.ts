import { Module } from '@nestjs/common';
import { AUDIT_RECORDER } from '../../common/audit/audit-recorder';
import {
  ObjectIdGenerator,
  SystemClock,
  type ResourceClock,
  type ResourceIdGenerator,
} from '../../common/resource';
import {
  AUDIT_CLOCK,
  AUDIT_ID_GENERATOR,
  AUDIT_LOG_REPOSITORY,
  type AuditLogRepository,
} from './application/ports';
import { AuditService } from './application/audit.service';
import { InMemoryAuditLogRepository } from './infrastructure/in-memory.repository';
import { AuditLogController } from './presentation/audit-log.controller';

/**
 * Audit module — owns the immutable `audit_logs` trail. Provides the read API (the in-app viewer) and binds
 * the cross-cutting `AUDIT_RECORDER` port (consumed by the global `AuditInterceptor` in app.module) to its
 * `AuditService`. Depends on no domain module (write is a generic recorder) → strictly one-way, no cycles.
 */
@Module({
  controllers: [AuditLogController],
  providers: [
    { provide: AUDIT_LOG_REPOSITORY, useClass: InMemoryAuditLogRepository },
    { provide: AUDIT_ID_GENERATOR, useValue: new ObjectIdGenerator() },
    { provide: AUDIT_CLOCK, useValue: new SystemClock() },
    {
      provide: AuditService,
      inject: [AUDIT_LOG_REPOSITORY, AUDIT_ID_GENERATOR, AUDIT_CLOCK],
      useFactory: (
        repo: AuditLogRepository,
        ids: ResourceIdGenerator,
        clock: ResourceClock,
      ): AuditService => new AuditService(repo, ids, clock),
    },
    { provide: AUDIT_RECORDER, useExisting: AuditService },
  ],
  exports: [AUDIT_RECORDER],
})
export class AuditModule {}
