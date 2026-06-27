/** TanStack Query keys for the Dashboard (read-only). */
export const dashboardKeys = {
  all: ['dashboard'] as const,
  summary: () => ['dashboard', 'summary'] as const,
};
