import { describe, it, expect } from 'vitest';
import {
  BILLING_PERMISSIONS,
  BILLING_PLANS,
  ChangePlanRequestSchema,
  PLAN_IDS,
  PlanSchema,
  SubscriptionResponseSchema,
} from '@stockflow/types';

describe('Billing contracts', () => {
  it('exposes view + manage permission keys', () => {
    expect(BILLING_PERMISSIONS).toEqual({ view: 'billing.view', manage: 'billing.manage' });
  });

  it('ships a valid plan catalog covering every plan id', () => {
    expect(BILLING_PLANS.map((p) => p.id)).toEqual([...PLAN_IDS]);
    for (const plan of BILLING_PLANS) {
      expect(PlanSchema.safeParse(plan).success).toBe(true);
    }
  });

  it('models enterprise as unlimited + custom-priced', () => {
    const enterprise = BILLING_PLANS.find((p) => p.id === 'enterprise');
    expect(enterprise?.priceMinor).toBeNull();
    expect(enterprise?.limits).toEqual({ maxVariants: null, maxLocations: null });
  });

  it('accepts a valid change-plan request and rejects unknown plans/fields', () => {
    expect(ChangePlanRequestSchema.safeParse({ planId: 'growth' }).success).toBe(true);
    expect(ChangePlanRequestSchema.safeParse({ planId: 'platinum' }).success).toBe(false);
    expect(ChangePlanRequestSchema.safeParse({ planId: 'free', extra: 1 }).success).toBe(false);
  });

  it('accepts a subscription response with nullable periods', () => {
    const ok = SubscriptionResponseSchema.safeParse({
      planId: 'free',
      status: 'active',
      currentPeriodStart: null,
      currentPeriodEnd: null,
      cancelAtPeriodEnd: false,
      updatedAt: null,
    });
    expect(ok.success).toBe(true);
  });
});
