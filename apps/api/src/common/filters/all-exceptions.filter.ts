import { type ArgumentsHost, Catch, type ExceptionFilter, HttpException } from '@nestjs/common';
import type { Response } from 'express';
import { ZodError } from 'zod';
import type { ApiErrorResponse, ErrorCode, ErrorDetail } from '@stockflow/types';
import { DomainError } from '../errors';
import type { ContextualRequest } from '../http/contextual-request';
import { rootLogger } from '../logging/logger';

const STATUS_TO_CODE: Record<number, ErrorCode> = {
  400: 'VALIDATION_ERROR',
  401: 'UNAUTHORIZED',
  403: 'FORBIDDEN',
  404: 'NOT_FOUND',
  409: 'CONFLICT',
  429: 'RATE_LIMITED',
};

interface ResolvedError {
  status: number;
  code: ErrorCode;
  message: string;
  details?: ErrorDetail[];
}

/**
 * Global exception filter — the single funnel that maps every thrown error to the
 * one API error envelope ({ error: { code, message, details?, requestId } }). Never
 * leaks stack traces or internals; logs 5xx with the correlation id (error-handling.md).
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const http = host.switchToHttp();
    const req = http.getRequest<ContextualRequest>();
    const res = http.getResponse<Response>();
    const requestId = req.requestId ?? 'unknown';

    const resolved = this.resolve(exception);

    if (resolved.status >= 500) {
      const log = req.log ?? rootLogger;
      log.error(
        {
          code: resolved.code,
          err: exception instanceof Error ? exception.stack : String(exception),
        },
        'request:unhandled',
      );
    }

    const body: ApiErrorResponse = {
      error: {
        code: resolved.code,
        message: resolved.message,
        requestId,
        ...(resolved.details !== undefined ? { details: resolved.details } : {}),
      },
    };

    res.status(resolved.status).json(body);
  }

  private resolve(exception: unknown): ResolvedError {
    if (exception instanceof DomainError) {
      return {
        status: exception.httpStatus,
        code: exception.code,
        message: exception.message,
        ...(exception.details !== undefined ? { details: exception.details } : {}),
      };
    }

    if (exception instanceof ZodError) {
      return {
        status: 400,
        code: 'VALIDATION_ERROR',
        message: 'Validation failed.',
        details: exception.issues.map((issue) => ({
          field: issue.path.join('.'),
          message: issue.message,
        })),
      };
    }

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      return {
        status,
        code: STATUS_TO_CODE[status] ?? 'INTERNAL_ERROR',
        message: exception.message,
      };
    }

    return {
      status: 500,
      code: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred.',
    };
  }
}
