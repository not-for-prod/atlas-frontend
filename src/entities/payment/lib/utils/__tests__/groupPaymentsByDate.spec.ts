import { describe, expect, it } from 'vitest';
import { groupPaymentsByDate } from '../groupPaymentsByDate';

describe('payment calendar groups', () => {
  const payments = [
    { id: 'first-page', createdAt: '2026-09-28T00:30:00Z' },
    { id: 'second-page', createdAt: '2026-09-27T22:00:00Z' },
    { id: 'older', createdAt: '2026-09-27T19:00:00Z' },
  ];
  it('combines pages on the same local calendar day without reordering receipts', () => {
    const groups = groupPaymentsByDate(payments, 'Europe/Moscow');
    expect(groups.map((group) => group.payments.map((payment) => payment.id))).toEqual([
      ['first-page', 'second-page'],
      ['older'],
    ]);
  });
  it('uses the display timezone rather than the UTC date prefix', () => {
    const groups = groupPaymentsByDate(payments, 'UTC');
    expect(groups.map((group) => group.payments.map((payment) => payment.id))).toEqual([
      ['first-page'],
      ['second-page', 'older'],
    ]);
  });
  it('does not invent groups for empty history', () => {
    expect(groupPaymentsByDate([])).toEqual([]);
  });
});
