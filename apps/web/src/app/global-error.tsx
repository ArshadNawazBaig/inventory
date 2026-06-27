'use client';

import { useEffect } from 'react';

/**
 * Root error boundary — replaces the entire document when the root layout itself
 * fails (so it ships its own <html>/<body> and uses inline styles, since global CSS
 * may not have loaded).
 */
export default function GlobalError({
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
    <html lang="en">
      <body
        style={{
          display: 'flex',
          minHeight: '100vh',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '1rem',
          padding: '2rem',
          textAlign: 'center',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        <h1 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Something went wrong</h1>
        <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>
          A critical error occurred. Please refresh the page.
        </p>
        <button
          type="button"
          onClick={reset}
          style={{
            border: '1px solid #d1d5db',
            borderRadius: '0.375rem',
            padding: '0.5rem 1rem',
            fontSize: '0.875rem',
            background: 'transparent',
            cursor: 'pointer',
          }}
        >
          Try again
        </button>
      </body>
    </html>
  );
}
