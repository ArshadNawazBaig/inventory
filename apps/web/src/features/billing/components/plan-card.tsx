'use client';

import { Badge, Button, Card, CardContent, CardHeader, CardTitle, cn } from '@stockflow/ui';
import { Check } from '@stockflow/icons';
import type { Plan } from '@stockflow/types';
import { formatPlanPrice, planPriceSuffix } from '../lib/billing-format';

export interface PlanCardProps {
  plan: Plan;
  isCurrent: boolean;
  pending: boolean;
  disabled: boolean;
  onSelect: () => void;
}

/** A single plan in the catalog grid — price, features, and a switch action (or "Current plan"). */
export function PlanCard({ plan, isCurrent, pending, disabled, onSelect }: PlanCardProps) {
  return (
    <Card className={cn('flex flex-col', isCurrent && 'border-primary ring-1 ring-primary')}>
      <CardHeader className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-base">{plan.name}</CardTitle>
          {isCurrent ? <Badge tone="primary">Current</Badge> : null}
        </div>
        <p className="flex items-baseline gap-1">
          <span className="text-2xl font-semibold tabular-nums text-foreground">{formatPlanPrice(plan)}</span>
          <span className="text-sm text-muted-foreground">{planPriceSuffix(plan)}</span>
        </p>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-4">
        <ul className="flex flex-1 flex-col gap-2">
          {plan.features.map((feature) => (
            <li key={feature} className="flex items-start gap-2 text-sm text-muted-foreground">
              <Check className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
              <span>{feature}</span>
            </li>
          ))}
        </ul>
        <Button
          variant={isCurrent ? 'outline' : 'default'}
          className="w-full"
          onClick={onSelect}
          disabled={isCurrent || disabled}
          loading={pending}
          loadingText="Switching…"
        >
          {isCurrent ? 'Current plan' : `Switch to ${plan.name}`}
        </Button>
      </CardContent>
    </Card>
  );
}
