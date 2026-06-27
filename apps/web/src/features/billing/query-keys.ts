/** TanStack Query keys for Billing. */
export const billingKeys = {
  all: ['billing'] as const,
  plans: () => ['billing', 'plans'] as const,
  subscription: () => ['billing', 'subscription'] as const,
  usage: () => ['billing', 'usage'] as const,
};
