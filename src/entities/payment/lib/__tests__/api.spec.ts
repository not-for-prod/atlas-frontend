import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getPayment, listPayments, requestCryptoAddress } from '../api';
afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});
beforeEach(() => vi.stubEnv('NEXT_PUBLIC_ATLAS_BACKEND_URL', 'http://localhost:8080'));
describe('payment API', () => {
  it('sends the same idempotency key on an explicit retry after unknown outcome', async () => {
    const fetcher = vi
      .fn()
      .mockRejectedValueOnce(new Error('timeout'))
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            walletId: 'wallet',
            requisite: { currency: 'USDT', network: 'tron', address: 'destination' },
          }),
        ),
      );
    vi.stubGlobal('fetch', fetcher);
    await expect(requestCryptoAddress('key')).rejects.toThrow();
    await requestCryptoAddress('key');
    expect(fetcher).toHaveBeenCalledTimes(2);
    for (const [, init] of fetcher.mock.calls) {
      expect(init.credentials).toBe('include');
      expect(JSON.parse(init.body)).toEqual({ idempotencyKey: 'key', currency: 'USDT', network: 'tron' });
    }
  });
  it.each([401, 403, 503])('preserves HTTP %s without demo fallback', async (status) => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('unavailable', { status })));
    await expect(listPayments('')).rejects.toMatchObject({ status });
  });
  it('rejects imprecise numeric amounts', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            payments: [
              {
                id: '1',
                createdAt: '2026-09-27T00:00:00Z',
                type: 'PAYMENT_TYPE_DEPOSIT',
                status: 'PAYMENT_STATUS_COMPLETED',
                amount: { currency: 'USDT', amount: 123 },
              },
            ],
          }),
        ),
      ),
    );
    await expect(listPayments('')).rejects.toMatchObject({ status: 503 });
  });
});

const receipt = {
  id: 'receipt',
  createdAt: '2026-09-27T00:00:00Z',
  type: 'PAYMENT_TYPE_DEPOSIT',
  status: 'PAYMENT_STATUS_COMPLETED',
  amount: { currency: 'USDT', amount: '9007199254.740993' },
};
describe('payment history pages', () => {
  it('preserves exact amounts and sends the opaque cursor with credentials', async () => {
    const page = { payments: [receipt], nextPageToken: 'next' };
    const fetcher = vi.fn().mockResolvedValue(new Response(JSON.stringify(page)));
    vi.stubGlobal('fetch', fetcher);
    await expect(listPayments('opaque+/=')).resolves.toEqual(page);
    const [url, init] = fetcher.mock.calls[0];
    expect(new URL(url).searchParams.get('page_token')).toBe('opaque+/=');
    expect(new URL(url).searchParams.get('page_size')).toBe('20');
    expect(init.credentials).toBe('include');
    expect(init.cache).toBe('no-store');
  });
  it.each([{}, { payments: [] }, { payments: [], nextPageToken: '' }])(
    'accepts an empty final page',
    async (page) => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify(page))));
      await expect(listPayments('')).resolves.toEqual(page);
    },
  );
  it.each([
    null,
    [],
    { payments: [null] },
    { payments: [receipt], nextPageToken: 123 },
    { payments: [receipt], nextPageToken: 'current' },
    { payments: [], nextPageToken: 'next' },
  ])('rejects malformed pages and non-advancing cursors', async (page) => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify(page))));
    await expect(listPayments('current')).rejects.toMatchObject({ status: 503 });
  });
});

it.each([
  'PAYMENT_STATUS_PENDING',
  'PAYMENT_STATUS_INSPECTION',
  'PAYMENT_STATUS_COMPLETED',
  'PAYMENT_STATUS_FAILED',
])('accepts verified deposit status %s without hiding the history', async (status) => {
  const page = { payments: [{ ...receipt, status }] };
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify(page))));
  await expect(listPayments('')).resolves.toEqual(page);
});
it('rejects an unknown deposit status', async () => {
  vi.stubGlobal(
    'fetch',
    vi
      .fn()
      .mockResolvedValue(new Response(JSON.stringify({ payments: [{ ...receipt, status: 'UNKNOWN' }] }))),
  );
  await expect(listPayments('')).rejects.toMatchObject({ status: 503 });
});

describe('payment detail', () => {
  it('encodes the selected ID and preserves fee and credited money', async () => {
    const payment = {
      ...receipt,
      id: 'receipt/a',
      fee: { currency: 'USDT', amount: '0.000000' },
      creditedAmount: { currency: 'USD', amount: '9007199254740993' },
    };
    const fetcher = vi.fn().mockResolvedValue(new Response(JSON.stringify({ payment })));
    vi.stubGlobal('fetch', fetcher);
    await expect(getPayment(payment.id)).resolves.toEqual(payment);
    expect(fetcher).toHaveBeenCalledWith(
      'http://localhost:8080/v1/payments/receipt%2Fa',
      expect.objectContaining({ credentials: 'include', cache: 'no-store' }),
    );
  });
  it.each([
    null,
    {},
    { payment: { ...receipt, id: 'another' } },
    { payment: { ...receipt, fee: { currency: 'USDT', amount: 0.5 } } },
  ])('rejects missing, mismatched, or imprecise details', async (data) => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify(data))));
    await expect(getPayment('receipt')).rejects.toMatchObject({ status: 503 });
  });
  it.each([401, 403, 404, 503])('preserves detail error %s', async (status) => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('unavailable', { status })));
    await expect(getPayment('receipt')).rejects.toMatchObject({ status });
  });
});

it('loads mixed deposit, issuance and card top-up history and top-up details', async () => {
  const cardOperation = {
    id: 'card-top-up:order',
    type: 'PAYMENT_TYPE_CARD_TOP_UP',
    status: 'PAYMENT_STATUS_COMPLETED',
    createdAt: '2026-10-03T17:12:54.066892Z',
    updatedAt: '2026-10-03T17:16:30.161090Z',
    amount: { amount: '1.05', currency: 'USD' },
    fee: { amount: '0.05', currency: 'USD' },
    creditedAmount: null,
    cardId: 'card',
    requisite: null,
    reservedAmount: { amount: '0', currency: 'USD' },
    releasedAmount: { amount: '0', currency: 'USD' },
  };
  const page = {
    payments: [
      cardOperation,
      {
        ...cardOperation,
        id: 'card-top-up:failed',
        status: 'PAYMENT_STATUS_FAILED',
        amount: { amount: '0.05', currency: 'USD' },
        releasedAmount: { amount: '1', currency: 'USD' },
      },
      { ...cardOperation, type: 'PAYMENT_TYPE_CARD_ISSUE', id: 'card-issue:order' },
      receipt,
    ],
    nextPageToken: '',
  };
  vi.stubGlobal(
    'fetch',
    vi
      .fn()
      .mockResolvedValueOnce(new Response(JSON.stringify(page)))
      .mockResolvedValueOnce(new Response(JSON.stringify({ payment: cardOperation }))),
  );
  await expect(listPayments('')).resolves.toEqual(page);
  await expect(getPayment(cardOperation.id)).resolves.toEqual(cardOperation);
});

it.each(['PAYMENT_STATUS_PENDING', 'PAYMENT_STATUS_COMPLETED', 'PAYMENT_STATUS_FAILED'])(
  'loads mixed crypto and SBP history and SBP detail with status %s',
  async (status) => {
    const sbp = {
      id: 'sbp:order',
      type: 'PAYMENT_TYPE_DEPOSIT',
      status,
      createdAt: '2026-10-07T14:54:33.543275Z',
      updatedAt: '2026-10-07T14:59:33.543274Z',
      amount: { currency: 'USD', amount: '100.25' },
      requisite: null,
      creditedAmount: status === 'PAYMENT_STATUS_COMPLETED' ? { currency: 'USD', amount: '100.25' } : null,
    };
    const page = { payments: [receipt, sbp] };
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce(new Response(JSON.stringify(page)))
      .mockResolvedValueOnce(new Response(JSON.stringify({ payment: sbp })));
    vi.stubGlobal('fetch', fetcher);
    await expect(listPayments('')).resolves.toEqual(page);
    await expect(getPayment(sbp.id)).resolves.toEqual(sbp);
    expect(fetcher.mock.calls[1][0]).toContain('/v1/payments/sbp%3Aorder');
  },
);
