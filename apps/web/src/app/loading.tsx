import { Spinner } from '@stockflow/ui';

/** Root route-level loading UI (App Router Suspense fallback). */
export default function Loading() {
  return (
    <div className="flex min-h-svh items-center justify-center bg-background">
      <Spinner />
      <span className="sr-only">Loading…</span>
    </div>
  );
}
