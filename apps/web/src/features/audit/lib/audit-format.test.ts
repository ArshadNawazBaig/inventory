import { describe, expect, it } from 'vitest';
import { formatActorType, humanizeAction, humanizeEntityType } from './audit-format';

describe('humanizeEntityType', () => {
  it('title-cases and de-snakes', () => {
    expect(humanizeEntityType('purchase_order')).toBe('Purchase order');
    expect(humanizeEntityType('product')).toBe('Product');
  });
});

describe('humanizeAction', () => {
  it('splits entity and verb into a readable phrase', () => {
    expect(humanizeAction('purchase_order.received')).toBe('Purchase order received');
    expect(humanizeAction('inventory.adjusted')).toBe('Inventory adjusted');
    expect(humanizeAction('product.created')).toBe('Product created');
  });

  it('degrades gracefully when there is no verb', () => {
    expect(humanizeAction('login')).toBe('Login');
  });
});

describe('formatActorType', () => {
  it('renders each actor type', () => {
    expect(formatActorType('user')).toBe('User');
    expect(formatActorType('system')).toBe('System');
    expect(formatActorType('api_key')).toBe('API key');
  });
});
