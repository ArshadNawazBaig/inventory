import { QueryClient } from '@tanstack/react-query';

/**
 * Creates a configured TanStack Query client — one instance per browser session
 * (see Providers), never shared across server requests. Server state lives here
 * exclusively and is never mirrored into Zustand (state-management.md).
 */
export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000, // 30s — treat data fresh briefly to avoid refetch storms
        gcTime: 5 * 60_000, // 5m — keep inactive cache before garbage collection
        retry: 2,
        refetchOnWindowFocus: false,
      },
      mutations: {
        retry: 0,
      },
    },
  });
}
