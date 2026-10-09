import { expect, it } from 'vitest';
import { formatSbpRate } from '../formatSbpRate';

it('displays the effective rate from the total payable amount and actual USD credit', () => {
  expect(
    formatSbpRate({
      amount: { amount: '994.27', currency: 'RUB' },
      credit: { amount: '10', currency: 'USD' },
    }),
  ).toBe('99,43 RUB');
});

it('keeps large monetary values exact', () => {
  expect(
    formatSbpRate({
      amount: { amount: '9007199254740993', currency: 'RUB' },
      credit: { amount: '100', currency: 'USD' },
    }),
  ).toBe('90\u00a0071\u00a0992\u00a0547\u00a0409,93 RUB');
});

it('does not infer a rate from missing, zero or incorrect denominations', () => {
  expect(formatSbpRate({})).toBeUndefined();
  expect(
    formatSbpRate({ amount: { amount: '100', currency: 'RUB' }, credit: { amount: '0', currency: 'USD' } }),
  ).toBeUndefined();
  expect(
    formatSbpRate({ amount: { amount: '100', currency: 'USD' }, credit: { amount: '10', currency: 'USD' } }),
  ).toBeUndefined();
});
