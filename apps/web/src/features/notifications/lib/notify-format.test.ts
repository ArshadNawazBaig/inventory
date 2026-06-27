import { describe, expect, it } from 'vitest';
import { formatRelativeTime, notificationTypeLabel } from './notify-format';

describe('notificationTypeLabel', () => {
  it('maps each type to a human label', () => {
    expect(notificationTypeLabel('purchase_order')).toBe('Purchase order');
    expect(notificationTypeLabel('sales_order')).toBe('Sales order');
    expect(notificationTypeLabel('return')).toBe('Return');
    expect(notificationTypeLabel('system')).toBe('System');
  });
});

describe('formatRelativeTime', () => {
  const now = Date.parse('2026-03-10T12:00:00.000Z');
  it('renders compact buckets relative to now', () => {
    expect(formatRelativeTime('2026-03-10T11:59:30.000Z', now)).toBe('just now');
    expect(formatRelativeTime('2026-03-10T11:55:00.000Z', now)).toBe('5m ago');
    expect(formatRelativeTime('2026-03-10T09:00:00.000Z', now)).toBe('3h ago');
    expect(formatRelativeTime('2026-03-08T12:00:00.000Z', now)).toBe('2d ago');
  });

  it('returns empty for an unparseable date', () => {
    expect(formatRelativeTime('nope', now)).toBe('');
  });
});
