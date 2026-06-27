import {
  type CallHandler,
  type ExecutionContext,
  Inject,
  Injectable,
  type NestInterceptor,
} from '@nestjs/common';
import { type Observable, tap } from 'rxjs';
import { AUDIT_RECORDER, type AuditRecorder } from '../audit/audit-recorder';
import { deriveAuditTarget } from '../audit/audit-target';
import type { ContextualRequest } from '../http/contextual-request';
import { rootLogger } from '../logging/logger';

const MUTATIONS = new Set(['POST', 'PATCH', 'PUT', 'DELETE']);

/**
 * Records an immutable audit-log entry for **every successful mutating request** — server-side, after the
 * guards (so only authorized actions are logged) and close to the write so clients cannot bypass it
 * (security/audit.md). The action/entity is derived from the route (a pure, tested helper); actor +
 * request metadata come from the request. Recording is best-effort: a failure is logged but never breaks the
 * user's request (audit must not be a single point of failure). Reads are not audited.
 */
@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(@Inject(AUDIT_RECORDER) private readonly recorder: AuditRecorder) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    if (context.getType() !== 'http') return next.handle();

    const http = context.switchToHttp();
    const req = http.getRequest<ContextualRequest>();
    if (!MUTATIONS.has(req.method.toUpperCase())) return next.handle();

    const res = http.getResponse<{ statusCode?: number }>();
    return next.handle().pipe(tap({ next: (body) => this.record(req, res, body) }));
  }

  private record(req: ContextualRequest, res: { statusCode?: number }, body: unknown): void {
    const organizationId = req.organizationId;
    if (organizationId === undefined) return; // no tenant resolved → nothing to attribute the action to

    const target = deriveAuditTarget(req.method, req.path, req.params, body);
    if (target === null) return; // unaudited route (audit/health) or unmappable method

    const actorId = req.userId ?? null;
    void this.recorder
      .record({
        organizationId,
        actorId,
        actorType: actorId ? 'user' : 'system',
        action: target.action,
        entityType: target.entityType,
        entityId: target.entityId,
        before: null,
        after: null,
        metadata: {
          ip: req.ip ?? null,
          userAgent: req.headers['user-agent'] ?? null,
          requestId: req.requestId ?? null,
          method: req.method.toUpperCase(),
          path: req.path,
          statusCode: res.statusCode ?? null,
        },
      })
      .catch((error: unknown) => {
        (req.log ?? rootLogger).warn(
          { err: error instanceof Error ? error.message : String(error), action: target.action },
          'audit:record-failed',
        );
      });
  }
}
