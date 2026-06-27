import {
  type CallHandler,
  type ExecutionContext,
  Injectable,
  type NestInterceptor,
} from '@nestjs/common';
import { type Observable, TimeoutError, catchError, throwError, timeout } from 'rxjs';
import { InternalError } from '../errors';

/** Hard upper bound on a single request before it is aborted. */
const DEFAULT_TIMEOUT_MS = 30_000;

/**
 * Aborts a handler that exceeds {@link DEFAULT_TIMEOUT_MS}, surfacing a safe 503
 * instead of letting a request hang. Heavy work belongs on a queue, not here.
 */
@Injectable()
export class TimeoutInterceptor implements NestInterceptor {
  intercept(_context: ExecutionContext, next: CallHandler): Observable<unknown> {
    return next.handle().pipe(
      timeout(DEFAULT_TIMEOUT_MS),
      catchError((error: unknown) => {
        if (error instanceof TimeoutError) {
          return throwError(() => new InternalError('The request timed out.', 503));
        }
        return throwError(() => error);
      }),
    );
  }
}
