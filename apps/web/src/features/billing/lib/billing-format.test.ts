import { describe, it, expect } from 'vitest';
import type { Plan } from '@stockflow/types';
import {
  formatLimit,
  formatPlanPrice,
  isOverLimit,
  planPriceSuffix,
  usagePercent,
} from './billing-format';

const plan = (over: Partial<Plan>): Plan => ({
  id: 'starter',
  name: 'Starter',
  priceMinor: 2900,
  currency: 'USD',
  interval: 'month',
  limits: { maxVariants: 1000, maxLocations: 5 },
  features: [],
  ...over,
});

describe('formatPlanPrice', () => {
  it('renders free, custom and priced plans', () => {
    expect(formatPlanPrice(plan({ priceMinor: 0 }))).toBe('Free');
    expect(formatPlanPrice(plan({ priceMinor: null }))).toBe('Custom');
    expect(formatPlanPrice(plan({ priceMinor: 2900 }))).toBe('29.00 USD');
  });
});

describe('planPriceSuffix', () => {
  it('only adds a suffix to recurring paid plans', () => {
    expect(planPriceSuffix(plan({ priceMinor: 2900, interval: 'month' }))).toBe('/mo');
    expect(planPriceSuffix(plan({ priceMinor: 2900, interval: 'year' }))).toBe('/yr');
    expect(planPriceSuffix(plan({ priceMinor: 0 }))).toBe('');
    expect(planPriceSuffix(plan({ priceMinor: null }))).toBe('');
  });
});

describe('formatLimit', () => {
  it('renders unlimited for null', () => {
    expect(formatLimit(null)).toBe('Unlimited');
    expect(formatLimit(25000)).toBe('25,000');
  });
});

describe('usagePercent / isOverLimit', () => {
  it('computes a clamped percentage and over-limit flag', () => {
    expect(usagePercent({ used: 50, limit: 100 })).toBe(50);
    expect(usagePercent({ used: 150, limit: 100 })).toBe(100); // clamped
    expect(usagePercent({ used: 3, limit: null })).toBeNull(); // unlimited
    expect(isOverLimit({ used: 150, limit: 100 })).toBe(true);
    expect(isOverLimit({ used: 3, limit: null })).toBe(false);
  });
});
