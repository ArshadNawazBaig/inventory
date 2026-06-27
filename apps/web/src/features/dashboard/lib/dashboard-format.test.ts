import { describe, it, expect } from 'vitest';
import { formatDelta, humanizeStatus, movementTypeLabel } from './dashboard-format';

describe('movementTypeLabel', () => {
  it('maps movement types to human labels', () => {
    expect(movementTypeLabel('transfer_out')).toBe('Transferred out');
    expect(movementTypeLabel('receipt')).toBe('Received');
    expect(movementTypeLabel('scrap')).toBe('Scrapped');
  });
});

describe('formatDelta', () => {
  it('adds a leading + to positive deltas, keeps the sign on negatives', () => {
    expect(formatDelta(10)).toBe('+10');
    expect(formatDelta(-3)).toBe('-3');
    expect(formatDelta(0)).toBe('0');
  });
});

describe('humanizeStatus', () => {
  it('title-cases snake_case statuses', () => {
    expect(humanizeStatus('partially_received')).toBe('Partially Received');
    expect(humanizeStatus('draft')).toBe('Draft');
    expect(humanizeStatus('in_transit')).toBe('In Transit');
  });
});
