import type { Plan, SubscriptionStatus, UsageMetric } from '@stockflow/types';
import { formatMinorToMajor } from '@/lib/money';

/** Pure presentation helpers for billing (no React) so they're trivially unit-testable. */

/** The headline price: "Free", "Custom" (null price), or "29.00 USD". */
export function formatPlanPrice(plan: Plan): string {
  if (plan.priceMinor === null) return 'Custom';
  if (plan.priceMinor === 0) return 'Free';
  return `${formatMinorToMajor(plan.priceMinor)} ${plan.currency}`;
}

/** The recurring suffix ("/mo" or "/yr"), empty for free/custom plans. */
export function planPriceSuffix(plan: Plan): string {
  if (plan.priceMinor === null || plan.priceMinor === 0) return '';
  return plan.interval === 'year' ? '/yr' : '/mo';
}

/** A limit for display ("Unlimited" for null). */
export function formatLimit(limit: number | null): string {
  return limit === null ? 'Unlimited' : limit.toLocaleString();
}

/** Usage as a 0–100 percentage, or null when the limit is unlimited / not applicable. */
export function usagePercent(metric: UsageMetric): number | null {
  if (metric.limit === null || metric.limit <= 0) return null;
  return Math.min(100, Math.round((metric.used / metric.limit) * 100));
}

/** Whether usage has exceeded the plan limit. */
export function isOverLimit(metric: UsageMetric): boolean {
  return metric.limit !== null && metric.used > metric.limit;
}

const STATUS_LABELS: Record<SubscriptionStatus, string> = {
  trialing: 'Trialing',
  active: 'Active',
  past_due: 'Past due',
  canceled: 'Canceled',
};

export function subscriptionStatusLabel(status: SubscriptionStatus): string {
  return STATUS_LABELS[status] ?? status;
}
