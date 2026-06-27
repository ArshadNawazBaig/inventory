import type { ReactNode } from 'react';

/**
 * Unauthenticated layout for auth flows (login, signup, accept-invite) — centered
 * and chrome-free. Pages are added with the auth module.
 */
export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <main className="flex min-h-svh flex-col items-center justify-center bg-muted/40 p-6">
      <div className="w-full max-w-sm">{children}</div>
    </main>
  );
}
