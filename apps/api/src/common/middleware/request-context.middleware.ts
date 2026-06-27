import { randomUUID } from 'node:crypto';
import { Injectable, type NestMiddleware } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';
import type { ContextualRequest } from '../http/contextual-request';
import { rootLogger } from '../logging/logger';

const REQUEST_ID_HEADER = 'x-request-id';

/**
 * Assigns each request a correlation id (honouring an inbound `x-request-id`, else
 * generating one) and attaches a child logger bound to it. Runs before guards and
 * interceptors so the id flows through the whole request lifecycle and into logs.
 */
@Injectable()
export class RequestContextMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction): void {
    const inbound = req.headers[REQUEST_ID_HEADER];
    const requestId =
      typeof inbound === 'string' && inbound.length > 0 ? inbound : randomUUID();

    const ctx = req as ContextualRequest;
    ctx.requestId = requestId;
    ctx.log = rootLogger.child({ requestId });

    res.setHeader(REQUEST_ID_HEADER, requestId);
    next();
  }
}
