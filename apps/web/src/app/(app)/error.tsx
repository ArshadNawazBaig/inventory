'use client';

import { useEffect } from 'react';
import { ErrorState } from '@/components/errors/error-state';

/** Error boundary for the authenticated section — renders inside the app shell. */
export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    void error.digest;
  }, [error]);

  return (
    <ErrorState onRetry={reset} description="This section failed to load. Please try again." />
  );
}
