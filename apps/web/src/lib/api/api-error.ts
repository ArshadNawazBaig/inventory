import type { ApiErrorBody, ApiErrorResponse, ErrorCode, ErrorDetail } from '@stockflow/types';

/**
 * A typed error for any non-2xx API response (or a transport failure). Carries the stable machine code,
 * HTTP status, field-level details, and the server `requestId` for support/correlation. Throwing this
 * (rather than a bare `Error`) lets the UI branch on `code` and map `details` back onto form fields.
 */
export class ApiError extends Error {
  readonly code: ErrorCode;
  readonly status: number;
  readonly details: ErrorDetail[];
  readonly requestId: string | undefined;

  constructor(params: {
    code: ErrorCode;
    message: string;
    status: number;
    details?: ErrorDetail[];
    requestId?: string;
  }) {
    super(params.message);
    this.name = 'ApiError';
    this.code = params.code;
    this.status = params.status;
    this.details = params.details ?? [];
    this.requestId = params.requestId;
  }

  /** True when the failure is a field-level validation problem (drives form error mapping). */
  get isValidation(): boolean {
    return this.code === 'VALIDATION_ERROR';
  }

  /** Field path → first message, for hydrating form errors from the server. */
  fieldErrors(): Record<string, string> {
    const map: Record<string, string> = {};
    for (const detail of this.details) {
      if (!(detail.field in map)) map[detail.field] = detail.message;
    }
    return map;
  }
}

/** Narrowing type guard for `{ error: { code, message, ... } }` bodies. */
function isApiErrorResponse(body: unknown): body is ApiErrorResponse {
  if (typeof body !== 'object' || body === null) return false;
  const error = (body as { error?: unknown }).error;
  return (
    typeof error === 'object' &&
    error !== null &&
    typeof (error as ApiErrorBody).code === 'string' &&
    typeof (error as ApiErrorBody).message === 'string'
  );
}

/** Build an {@link ApiError} from an HTTP status + parsed body, tolerating non-envelope responses. */
export function toApiError(status: number, body: unknown): ApiError {
  if (isApiErrorResponse(body)) {
    const { code, message, details, requestId } = body.error;
    return new ApiError({
      code,
      message,
      status,
      ...(details ? { details } : {}),
      ...(requestId ? { requestId } : {}),
    });
  }
  return new ApiError({
    code: 'INTERNAL_ERROR',
    message: `Request failed with status ${status}.`,
    status,
  });
}

/** Wrap a transport/parse failure (no HTTP response) as an {@link ApiError}. */
export function toTransportError(cause: unknown): ApiError {
  const message =
    cause instanceof Error ? cause.message : 'Network request failed. Please try again.';
  return new ApiError({ code: 'INTERNAL_ERROR', message, status: 0 });
}

/** Human-facing message for any thrown value (used by toasts / error states). */
export function errorMessage(error: unknown): string {
  if (error instanceof ApiError) return error.message;
  if (error instanceof Error) return error.message;
  return 'Something went wrong. Please try again.';
}
