import { expect, it } from 'vitest';
import { formatPaymentMoney } from '../formatPaymentMoney';
it('distinguishes an absent fee from an explicit zero fee', () => {
  expect(formatPaymentMoney()).toBeUndefined();
  expect(formatPaymentMoney({ currency: 'USDT', amount: '0.000000' })).toBe('0 USDT');
});
it('preserves exact atomic money beyond the safe Number range', () => {
  expect(formatPaymentMoney({ currency: 'USD', amount: '90071992547409.93' })).toBe(
    '90\u00a0071\u00a0992\u00a0547\u00a0409,93 USD',
  );
  expect(formatPaymentMoney({ currency: 'USDT', amount: '7.481300' })).toBe('7,4813 USDT');
});
