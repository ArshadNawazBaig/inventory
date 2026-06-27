import {
  type CallHandler,
  type ExecutionContext,
  Injectable,
  type NestInterceptor,
} from '@nestjs/common';
import { type Observable, tap } from 'rxjs';
import type { ContextualRequest } from '../http/contextual-request';
import { rootLogger } from '../logging/logger';

/**
 * Logs request start and completion with method, route, status, and duration, all
 * tagged with the per-request correlation id (logging.md). Skips non-HTTP contexts.
 */
@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    if (context.getType() !== 'http') {
      return next.handle();
    }

    const http = context.switchToHttp();
    const req = http.getRequest<ContextualRequest>();
    const res = http.getResponse<{ statusCode: number }>();
    const log = req.log ?? rootLogger;
    const start = Date.now();
    const method = req.method;
    const url = req.originalUrl;

    log.info({ method, url }, 'request:start');

    return next.handle().pipe(
      tap({
        next: () => {
          log.info(
            { method, url, statusCode: res.statusCode, durationMs: Date.now() - start },
            'request:finish',
          );
        },
        error: (error: unknown) => {
          log.warn(
            {
              method,
              url,
              durationMs: Date.now() - start,
              err: error instanceof Error ? error.message : String(error),
            },
            'request:error',
          );
        },
      }),
    );
  }
}
