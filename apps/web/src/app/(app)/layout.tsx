import type { ReactNode } from 'react';
import { AppShell } from './_components/app-shell';

/**
 * Authenticated section layout — wraps every (app) route in the shell. Session
 * enforcement (redirect to /login when unauthenticated) is added here with the auth
 * module; this is the single, intended insertion point (routing.md).
 */
export default function AppLayout({ children }: { children: ReactNode }) {
  return <AppShell>{children}</AppShell>;
}
