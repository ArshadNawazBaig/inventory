import { Injectable } from '@nestjs/common';
import type { SubscriptionEntity } from '../domain/entities';
import type { SubscriptionRepository } from '../application/ports';

/**
 * In-memory subscription store — the runnable, fully-testable persistence until the database module lands.
 * One row per tenant, keyed by `organizationId`. The Mongoose adapter implements the same port (an upsert on
 * `{ organizationId }`, kept in sync with Stripe via webhooks) and drops in unchanged.
 */
@Injectable()
export class InMemorySubscriptionRepository implements SubscriptionRepository {
  private readonly store = new Map<string, SubscriptionEntity>();

  findByOrg(organizationId: string): Promise<SubscriptionEntity | null> {
    const found = this.store.get(organizationId);
    return Promise.resolve(found ? { ...found } : null);
  }

  upsert(subscription: SubscriptionEntity): Promise<SubscriptionEntity> {
    this.store.set(subscription.organizationId, { ...subscription });
    return Promise.resolve({ ...subscription });
  }
}
