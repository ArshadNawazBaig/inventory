/** TanStack Query keys for Settings (organization singleton). */
export const settingsKeys = {
  all: ['settings'] as const,
  detail: () => ['settings', 'detail'] as const,
};
