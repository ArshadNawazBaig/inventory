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
  /** Tenant + actor set by the auth layer (dev guard today, Better Auth later). */
  organizationId?: string;
  userId?: string;
}
