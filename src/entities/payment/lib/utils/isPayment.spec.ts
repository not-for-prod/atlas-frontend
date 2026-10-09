import { expect, it } from 'vitest';
import { isPayment } from './isPayment';
const receipt = {
  id: 'card-issue:order',
  type: 'PAYMENT_TYPE_CARD_ISSUE',
  status: 'PAYMENT_STATUS_FAILED',
  createdAt: '2026-09-30T12:00:00Z',
  amount: { currency: 'USD', amount: '500' },
  fee: { currency: 'USD', amount: '500' },
  reservedAmount: { currency: 'USD', amount: '0' },
  releasedAmount: { currency: 'USD', amount: '2000' },
};
it('accepts a card expense with explicit settled and released amounts', () => {
  expect(isPayment(receipt)).toBe(true);
  expect(
    isPayment({
      ...receipt,
      amount: { currency: 'USD', amount: '0' },
      fee: { currency: 'USD', amount: '0' },
    }),
  ).toBe(true);
});
it('rejects malformed monetary breakdown or deposit instructions on a card payment', () => {
  expect(isPayment({ ...receipt, releasedAmount: { currency: 'USDT', amount: '0.002000' } })).toBe(false);
  expect(isPayment({ ...receipt, reservedAmount: undefined })).toBe(false);
  expect(
    isPayment({
      ...receipt,
      requisite: { crypto: { currency: 'USDT', network: 'tron', address: 'address' } },
    }),
  ).toBe(false);
});

it.each(['PAYMENT_STATUS_PENDING', 'PAYMENT_STATUS_COMPLETED', 'PAYMENT_STATUS_FAILED'])(
  'accepts card top-up status %s with the USD reservation breakdown',
  (status) => {
    const payment = { ...receipt, id: 'card-top-up:order', type: 'PAYMENT_TYPE_CARD_TOP_UP', status };
    expect(isPayment(payment)).toBe(true);
    expect(isPayment({ ...payment, fee: null })).toBe(false);
    expect(isPayment({ ...payment, reservedAmount: null })).toBe(false);
    expect(isPayment({ ...payment, amount: { currency: 'USDT', amount: '1.05' } })).toBe(false);
    expect(
      isPayment({ ...payment, requisite: { crypto: { currency: 'USD', network: '', address: '' } } }),
    ).toBe(false);
  },
);
it('rejects a card top-up mislabeled as a USD crypto deposit', () => {
  expect(
    isPayment({
      ...receipt,
      type: 'PAYMENT_TYPE_DEPOSIT',
      requisite: { crypto: { currency: 'USD', network: '', address: '' } },
    }),
  ).toBe(false);
});

it.each(['PAYMENT_STATUS_PENDING', 'PAYMENT_STATUS_COMPLETED', 'PAYMENT_STATUS_FAILED'])(
  'accepts an SBP USD receipt with status %s and no crypto instructions',
  (status) => {
    const payment = {
      id: 'sbp:order',
      type: 'PAYMENT_TYPE_DEPOSIT',
      status,
      createdAt: '2026-10-07T14:54:33.543275Z',
      amount: { currency: 'USD', amount: '100.25' },
      requisite: null,
    };
    expect(isPayment(payment)).toBe(true);
    expect(isPayment({ ...payment, amount: { currency: 'USD', amount: 100.25 } })).toBe(false);
    expect(isPayment({ ...payment, amount: { currency: 'RUB', amount: '9928.03' } })).toBe(false);
    expect(
      isPayment({ ...payment, requisite: { crypto: { currency: 'USD', network: '', address: '' } } }),
    ).toBe(false);
  },
);
