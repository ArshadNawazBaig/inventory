import type { ReactNode } from 'react';
import { SessionGuard } from '@/features/auth/components/session-guard';
import { AppShell } from './_components/app-shell';

/**
 * Authenticated section layout — gates every (app) route on a valid session (redirecting to /login when
 * absent), then renders the shell. The server still enforces auth on every API call; this is the UX gate.
 */
export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <SessionGuard>
      <AppShell>{children}</AppShell>
    </SessionGuard>
  );
}
