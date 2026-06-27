import {
  type CallHandler,
  type ExecutionContext,
  Inject,
  Injectable,
  type NestInterceptor,
} from '@nestjs/common';
import { type Observable, tap } from 'rxjs';
import type { ContextualRequest } from '../http/contextual-request';
import { rootLogger } from '../logging/logger';
import { NOTIFIER, type Notifier } from '../notifications/notifier';
import { deriveNotification } from '../notifications/notification-rules';

const MUTATIONS = new Set(['POST', 'PATCH', 'PUT', 'DELETE']);

/**
 * Turns a **curated** set of successful mutations into an in-app notification (the rules live in a pure,
 * tested helper). Runs after the guards on the success path, like the audit interceptor, but is selective —
 * only noteworthy state transitions notify. The recipient is the acting user for now (role/member fan-out is a
 * documented follow-up; system actions with no actor are skipped). Best-effort: a failure is logged, never
 * breaks the user's request.
 */
@Injectable()
export class NotificationInterceptor implements NestInterceptor {
  constructor(@Inject(NOTIFIER) private readonly notifier: Notifier) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    if (context.getType() !== 'http') return next.handle();

    const req = context.switchToHttp().getRequest<ContextualRequest>();
    if (!MUTATIONS.has(req.method.toUpperCase())) return next.handle();

    return next.handle().pipe(tap({ next: (body) => this.notify(req, body) }));
  }

  private notify(req: ContextualRequest, body: unknown): void {
    const organizationId = req.organizationId;
    const recipientId = req.userId;
    if (organizationId === undefined || recipientId === undefined) return; // no tenant/actor to notify

    const derived = deriveNotification(req.method, req.path, req.params, body);
    if (derived === null) return; // not a notification-worthy action

    void this.notifier
      .notify({
        organizationId,
        recipientId,
        type: derived.type,
        title: derived.title,
        body: derived.body,
        entityType: derived.entityType,
        entityId: derived.entityId,
        link: derived.link,
      })
      .catch((error: unknown) => {
        (req.log ?? rootLogger).warn(
          { err: error instanceof Error ? error.message : String(error), title: derived.title },
          'notification:enqueue-failed',
        );
      });
  }
}
