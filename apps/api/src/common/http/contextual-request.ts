import type { Request } from 'express';
import type { Logger } from 'pino';

/**
 * Express request augmented by {@link RequestContextMiddleware} with a correlation
 * id and a per-request child logger. Downstream code (interceptors, the exception
 * filter, the `@ReqId()` decorator) reads these.
 */
export interface ContextualRequest extends Request {
  requestId: string;
  log: Logger;
  /** Tenant + actor + effective permissions set by the {@link AuthGuard} from the session. */
  organizationId?: string;
  userId?: string;
  permissions?: string[];
}
