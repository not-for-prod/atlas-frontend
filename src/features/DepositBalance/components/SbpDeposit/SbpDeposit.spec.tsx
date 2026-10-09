import { StrictMode } from 'react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MantineProvider } from '@mantine/core';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { IntlProvider } from 'react-intl';
import messages from '../../../../../dictionaries/ru.json';
import { SbpDeposit } from './SbpDeposit';
const preview = {
  id: 'quote',
  amount: { amount: '1000.01', currency: 'RUB' },
  fee: { amount: '10', currency: 'RUB' },
  credit: { amount: '9.9', currency: 'USD' },
  exchangeRate: '0.01',
  expiresAt: '',
};
const payment = {
  ...preview,
  id: 'payment',
  previewId: 'quote',
  status: 'pending',
  paymentLink: 'https://app.pay.hot/checkout#secret',
  createdAt: '2026-10-07T00:00:00Z',
  updatedAt: '2026-10-07T00:00:00Z',
};
const json = (data: unknown) => new Response(JSON.stringify(data));
beforeEach(() => {
  vi.stubEnv('NEXT_PUBLIC_ATLAS_BACKEND_URL', 'http://localhost:8080');
  preview.expiresAt = new Date(Date.now() + 30000).toISOString();
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});
function mount() {
  const close = vi.fn();
  render(
    <StrictMode>
      <MantineProvider>
        <IntlProvider locale="ru" messages={messages}>
          <QueryClientProvider client={new QueryClient()}>
            <SbpDeposit amount="9.90" onBack={vi.fn()} onClose={close} />
          </QueryClientProvider>
        </IntlProvider>
      </MantineProvider>
    </StrictMode>,
  );
  return close;
}
it('automatically creates once under Strict Mode and polls confirmation without claiming balance credit', async () => {
  const fetcher = vi
    .fn()
    .mockImplementation((path: string) =>
      Promise.resolve(
        json(
          path.endsWith('/previews')
            ? { preview }
            : { payment: path.endsWith('/payment') ? { ...payment, status: 'completed' } : payment },
        ),
      ),
    );
  vi.stubGlobal('fetch', fetcher);
  const close = mount();
  expect(await screen.findByText(messages['sbp.status.completed'])).toBeVisible();
  expect(screen.getByText(messages['sbp.creditPending'])).toBeVisible();
  expect(screen.queryByRole('button', { name: messages['sbp.confirm'] })).not.toBeInTheDocument();
  expect(fetcher.mock.calls.filter(([path]) => path.endsWith('/sbp'))).toHaveLength(1);
  await userEvent.setup().click(screen.getByRole('button', { name: messages['sbp.close'] }));
  expect(close).toHaveBeenCalledOnce();
});
it('retries an unknown create only manually with the original preview and preserves Checkout fallback', async () => {
  let creates = 0;
  const fetcher = vi.fn().mockImplementation((path: string) => {
    if (path.endsWith('/sbp') && ++creates === 1) return Promise.reject(new Error('timeout'));
    return Promise.resolve(
      json(
        path.endsWith('/previews')
          ? { preview }
          : path.endsWith('/qr')
            ? { qr: { status: 'SBP_QR_STATUS_CHECKOUT_REQUIRED' } }
            : { payment },
      ),
    );
  });
  vi.stubGlobal('fetch', fetcher);
  mount();
  expect(await screen.findByText(messages['sbp.unknown'])).toBeVisible();
  expect(creates).toBe(1);
  await userEvent.setup().click(screen.getByRole('button', { name: messages['sbp.retrySame'] }));
  expect(await screen.findByRole('link', { name: messages['sbp.openCheckout'] })).toHaveAttribute(
    'href',
    payment.paymentLink,
  );
  const requests = fetcher.mock.calls.filter(([path]) => path.endsWith('/sbp'));
  expect(requests).toHaveLength(2);
  expect(requests[0][1].body).toBe(requests[1][1].body);
});
it('blocks an expired unaccepted quote without creating an order', async () => {
  const fetcher = vi
    .fn()
    .mockImplementation(() =>
      Promise.resolve(json({ preview: { ...preview, expiresAt: '2000-01-01T00:00:00Z' } })),
    );
  vi.stubGlobal('fetch', fetcher);
  mount();
  expect(await screen.findByText(messages['sbp.expired'])).toBeVisible();
  expect(fetcher.mock.calls.filter(([path]) => path.endsWith('/sbp'))).toHaveLength(0);
});
it('shows unavailable quoting and an explicit retry', async () => {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockImplementation(() => Promise.resolve(new Response('', { status: 503 }))),
  );
  mount();
  expect(await screen.findByRole('alert')).toHaveTextContent(messages['sbp.unavailable']);
  expect(screen.queryByText('9,90 USD')).not.toBeInTheDocument();
});
it('admits only an explicitly refreshed valid quote after expiry', async () => {
  let refreshed = false;
  const next = {
    ...preview,
    id: 'refreshed',
    amount: { amount: '505', currency: 'RUB' },
    exchangeRate: '0.02',
  };
  const fetcher = vi
    .fn()
    .mockImplementation((path: string) =>
      Promise.resolve(
        json(
          path.endsWith('/previews')
            ? { preview: refreshed ? next : { ...preview, expiresAt: '2000-01-01T00:00:00Z' } }
            : path.endsWith('/qr')
              ? { qr: { status: 'SBP_QR_STATUS_CHECKOUT_REQUIRED' } }
              : { payment: { ...payment, ...next, id: 'payment', previewId: 'refreshed' } },
        ),
      ),
    );
  vi.stubGlobal('fetch', fetcher);
  mount();
  await screen.findByText(messages['sbp.expired']);
  expect(fetcher.mock.calls.filter(([path]) => path.endsWith('/sbp'))).toHaveLength(0);
  refreshed = true;
  await userEvent.setup().click(screen.getByRole('button', { name: messages['sbp.refreshQuote'] }));
  await screen.findByRole('link', { name: messages['sbp.openCheckout'] });
  await waitFor(() => expect(fetcher.mock.calls.filter(([path]) => path.endsWith('/sbp'))).toHaveLength(1));
  expect(JSON.parse(fetcher.mock.calls.find(([path]) => path.endsWith('/sbp'))![1].body)).toEqual({
    previewId: 'refreshed',
  });
});
