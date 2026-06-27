import type { SubscriptionResponse } from '@stockflow/types';
import type { SubscriptionEntity } from '../domain/entities';

/** Map the subscription entity to the API response (timestamps → ISO; org id + provider id stay internal). */
export function toSubscriptionResponse(entity: SubscriptionEntity): SubscriptionResponse {
  return {
    planId: entity.planId,
    status: entity.status,
    currentPeriodStart: entity.currentPeriodStart ? entity.currentPeriodStart.toISOString() : null,
    currentPeriodEnd: entity.currentPeriodEnd ? entity.currentPeriodEnd.toISOString() : null,
    cancelAtPeriodEnd: entity.cancelAtPeriodEnd,
    updatedAt: entity.updatedAt ? entity.updatedAt.toISOString() : null,
  };
}
