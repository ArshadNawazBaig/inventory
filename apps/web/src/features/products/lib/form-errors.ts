import type { FieldValues, Path, UseFormSetError } from 'react-hook-form';
import { ApiError } from '@/lib/api';

/**
 * Bridge server-side validation back onto the form. When the API rejects with field-level details
 * (`VALIDATION_ERROR`), each `{ field, message }` is applied via `setError` so the offending input shows
 * the server's reason. Returns true when at least one field error was applied — the caller then shows a
 * summary toast instead of a generic one. Non-validation failures (conflict, network) return false.
 */
export function applyApiErrorToForm<TFieldValues extends FieldValues>(
  error: unknown,
  setError: UseFormSetError<TFieldValues>,
): boolean {
  if (!(error instanceof ApiError) || !error.isValidation || error.details.length === 0) {
    return false;
  }
  for (const detail of error.details) {
    // The server owns the field path (e.g. "variants.0.sku"); RHF stores it verbatim.
    setError(detail.field as Path<TFieldValues>, { type: 'server', message: detail.message });
  }
  return true;
}
