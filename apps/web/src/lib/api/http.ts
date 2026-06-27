import type { ZodType } from 'zod';
import { API_BASE_URL, devTenantHeaders } from './config';
import { toApiError, toTransportError } from './api-error';

export type QueryValue = string | number | boolean | undefined | null;

export interface RequestOptions<T> {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  /** JSON body (serialized; omit for GET/DELETE). */
  body?: unknown;
  /** Query params; `undefined`/`null`/`''` entries are dropped. */
  query?: Record<string, QueryValue>;
  /** Response contract — when provided, the body is validated (output validation). */
  schema?: ZodType<T>;
  signal?: AbortSignal;
}

/** Append allow-listed query params, skipping empty values. */
function buildUrl(path: string, query?: Record<string, QueryValue>): string {
  const url = new URL(`${API_BASE_URL}${path}`);
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value === undefined || value === null || value === '') continue;
      url.searchParams.set(key, String(value));
    }
  }
  return url.toString();
}

/**
 * The single fetch seam for the web app. Adds JSON + (dev) tenant headers, throws a typed {@link ApiError}
 * on any non-2xx response or transport failure, and validates the success body against the response
 * contract when a `schema` is given. All feature API modules go through this — there is one place that
 * knows how to talk to the API.
 */
export async function apiRequest<T>(path: string, options: RequestOptions<T> = {}): Promise<T> {
  const { method = 'GET', body, query, schema, signal } = options;

  const headers: Record<string, string> = { accept: 'application/json', ...devTenantHeaders() };
  if (body !== undefined) headers['content-type'] = 'application/json';

  let response: Response;
  try {
    response = await fetch(buildUrl(path, query), {
      method,
      headers,
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
      ...(signal ? { signal } : {}),
    });
  } catch (cause) {
    throw toTransportError(cause);
  }

  // 204 No Content (delete) — nothing to parse.
  if (response.status === 204) return undefined as T;

  const text = await response.text();
  const data: unknown = text ? safeJsonParse(text) : undefined;

  if (!response.ok) {
    throw toApiError(response.status, data);
  }

  return schema ? schema.parse(data) : (data as T);
}

function safeJsonParse(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}
