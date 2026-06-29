'use client';

import { useEffect, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { Spinner } from '@stockflow/ui';
import { useSession } from '../use-session';

/**
 * Client-side route protection for the authenticated `(app)` section. While the session resolves it shows a
 * spinner; when there is no session it redirects to `/login`. The server is still the real gate — every API
 * call requires the session cookie — this only keeps unauthenticated users out of the app chrome.
 */
export function SessionGuard({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { data: session, isPending } = useSession();

  // Once the session resolves, anything that isn't an authenticated user (logged-out 401 → null, or a
  // transport/error → undefined) sends the user to /login. Never hang on the spinner.
  useEffect(() => {
    if (!isPending && !session) router.replace('/login');
  }, [isPending, session, router]);

  if (session) return <>{children}</>;
  return (
    <div className="flex min-h-svh items-center justify-center bg-background">
      <Spinner />
      <span className="sr-only">Loading…</span>
    </div>
  );
}
