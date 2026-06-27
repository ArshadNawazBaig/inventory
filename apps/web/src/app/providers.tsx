'use client';

import { useState, type ReactNode } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { Toaster, TooltipProvider } from '@stockflow/ui';
import { ThemeProvider } from '@/components/theme/theme-provider';
import { createQueryClient } from '@/lib/query-client';

/**
 * Client provider tree mounted once at the root: server-state cache (TanStack
 * Query), theme synchronisation, tooltip context, and the global toast viewport.
 */
export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => createQueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TooltipProvider>
          {children}
          <Toaster />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
