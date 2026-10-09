import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { getSbpPreview, createSbpPayment, getSbpPayment, getSbpPaymentQr } from './sbpApi';
const preview = {
  id: 'quote',
  amount: { amount: '1000.01', currency: 'RUB' },
  fee: { amount: '10', currency: 'RUB' },
  credit: { amount: '9.9', currency: 'USD' },
  exchangeRate: '0.01',
  expiresAt: new Date(Date.now() + 30000).toISOString(),
};
const payment = {
  ...preview,
  id: 'payment',
  previewId: preview.id,
  status: 'pending',
  paymentLink: 'https://app.pay.hot/checkout#secret',
  createdAt: '2026-10-07T00:00:00Z',
  updatedAt: '2026-10-07T00:00:00Z',
};
beforeEach(() => vi.stubEnv('NEXT_PUBLIC_ATLAS_BACKEND_URL', 'http://localhost:8080'));
afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});
it('sends desired USD and retains preview identity and the full checkout fragment', async () => {
  const fetcher = vi
    .fn()
    .mockResolvedValueOnce(new Response(JSON.stringify({ preview })))
    .mockRejectedValueOnce(new Error('timeout'))
    .mockResolvedValueOnce(new Response(JSON.stringify({ payment })));
  vi.stubGlobal('fetch', fetcher);
  const quote = await getSbpPreview('9.9');
  expect(JSON.parse(fetcher.mock.calls[0][1].body)).toEqual({ usdAmount: '9.9' });
  await expect(createSbpPayment(quote)).rejects.toThrow('timeout');
  expect((await createSbpPayment(quote)).paymentLink).toBe(payment.paymentLink);
  expect(fetcher.mock.calls[1][1].body).toBe(fetcher.mock.calls[2][1].body);
  expect(JSON.parse(fetcher.mock.calls[2][1].body)).toEqual({ previewId: 'quote' });
  expect(fetcher.mock.calls[2][1].credentials).toBe('include');
});
it.each([401, 403, 503])('preserves HTTP %s without fixtures', async (status) => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('', { status })));
  await expect(getSbpPreview('9.9')).rejects.toMatchObject({ status });
});
it.each([
  { amount: { amount: 1000.01, currency: 'RUB' } },
  { fee: { amount: '1001', currency: 'RUB' } },
  { credit: { amount: '10', currency: 'USD' } },
  { amount: { amount: '1000.01', currency: 'USD' } },
  { expiresAt: 'bad' },
])('rejects invalid quote facts %j', async (override) => {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue(new Response(JSON.stringify({ preview: { ...preview, ...override } }))),
  );
  await expect(getSbpPreview('9.9')).rejects.toMatchObject({ status: 503 });
});
it.each(['javascript:alert(1)', 'https://user:secret@app.pay.hot', 'http://app.pay.hot'])(
  'rejects unsafe checkout %s',
  async (paymentLink) => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(new Response(JSON.stringify({ payment: { ...payment, paymentLink } }))),
    );
    await expect(getSbpPayment('payment')).rejects.toMatchObject({ status: 503 });
  },
);
it('rejects changed creation quote or mismatched lookup identity', async () => {
  vi.stubGlobal(
    'fetch',
    vi
      .fn()
      .mockImplementation(() =>
        Promise.resolve(new Response(JSON.stringify({ payment: { ...payment, previewId: 'other' } }))),
      ),
  );
  await expect(createSbpPayment(preview)).rejects.toMatchObject({ status: 503 });
  await expect(getSbpPayment('other')).rejects.toMatchObject({ status: 503 });
});

it('reads the original order QR and preserves its full NSPK payment payload', async () => {
  const qr = {
    status: 'SBP_QR_STATUS_AVAILABLE',
    url: 'https://qr.nspk.ru/ABCD1234?type=02&sum=100001',
    expiresAt: new Date(Date.now() + 60000).toISOString(),
  };
  const fetcher = vi.fn().mockResolvedValue(new Response(JSON.stringify({ qr })));
  vi.stubGlobal('fetch', fetcher);
  expect(await getSbpPaymentQr('payment')).toEqual(qr);
  expect(fetcher.mock.calls[0][0]).toContain('/v1/payments/sbp/payment/qr');
});
it.each([
  'https://app.pay.hot/checkout',
  'https://qr.nspk.ru.evil.test/ABCD',
  'http://qr.nspk.ru/ABCD',
  'https://qr.nspk.ru/ABCD#token',
])('rejects QR access outside the direct NSPK contract: %s', async (url) => {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          qr: {
            status: 'SBP_QR_STATUS_AVAILABLE',
            url,
            expiresAt: new Date(Date.now() + 60000).toISOString(),
          },
        }),
      ),
    ),
  );
  await expect(getSbpPaymentQr('payment')).rejects.toMatchObject({ status: 503 });
});
