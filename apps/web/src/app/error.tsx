'use client';

import { useEffect } from 'react';
import { ErrorState } from '@/components/errors/error-state';

/** Route-segment error boundary (App Router) — catches render/data errors below the root layout. */
export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Report to Sentry here once monitoring is wired; `digest` is the correlation id.
    void error.digest;
  }, [error]);

  return <ErrorState onRetry={reset} />;
}
