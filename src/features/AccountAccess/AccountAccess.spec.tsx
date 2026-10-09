import { afterEach, expect, it, vi } from 'vitest';
import { act, cleanup, render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MantineProvider } from '@mantine/core';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { IntlProvider } from 'react-intl';
import messages from '../../../dictionaries/ru.json';
import { ProfileKYC } from '~/features/ProfileKYC';
import { authApi } from '~/entities/auth';
import type * as AuthModule from '~/entities/auth';
import { WalletBalance } from '~/entities/client-asset';
import { PaymentHistory } from '~/widgets/PaymentHistory';
import { BalanceVisibilityProvider } from '~/shared/ui/BalanceVisibilityProvider';
import { AccountAccess } from './AccountAccess';

const router = vi.hoisted(() => ({ replace: vi.fn() }));
vi.mock('next/navigation', () => ({ useRouter: () => router }));
vi.mock('~/entities/auth', async (importOriginal) => ({
  ...(await importOriginal<typeof AuthModule>()),
  authApi: { session: vi.fn() },
}));
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  vi.clearAllMocks();
});
function setup() {
  vi.stubEnv('NEXT_PUBLIC_ATLAS_BACKEND_URL', 'http://localhost:8080');
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <MantineProvider>
      <IntlProvider locale="ru" messages={messages}>
        <QueryClientProvider client={client}>
          <BalanceVisibilityProvider>
            <AccountAccess>
              <WalletBalance />
              <PaymentHistory />
            </AccountAccess>
          </BalanceVisibilityProvider>
        </QueryClientProvider>
      </IntlProvider>
    </MantineProvider>,
  );
  return client;
}
it('does not request or render private data before session verification or while signed out', async () => {
  let resolve!: (value: { authenticated: boolean }) => void;
  vi.mocked(authApi.session).mockReturnValue(
    new Promise((done) => {
      resolve = done;
    }),
  );
  const fetcher = vi.fn();
  vi.stubGlobal('fetch', fetcher);
  const client = setup();
  expect(fetcher).not.toHaveBeenCalled();
  expect(router.replace).not.toHaveBeenCalled();
  await act(async () => resolve({ authenticated: false }));
  await waitFor(() => expect(router.replace).toHaveBeenCalledWith('/account'));
  expect(screen.queryByText(messages['crypto.history'])).not.toBeInTheDocument();
  expect(fetcher).not.toHaveBeenCalled();
  client.clear();
});
it.each([401, 403])(
  'removes previously loaded history when balance rejects access with %s',
  async (status) => {
    vi.mocked(authApi.session).mockResolvedValue({ authenticated: true });
    let expired = false;
    const payment = {
      id: 'private-payment',
      type: 'PAYMENT_TYPE_DEPOSIT',
      status: 'PAYMENT_STATUS_COMPLETED',
      createdAt: '2026-09-27T00:00:00Z',
      amount: { currency: 'USDT', amount: '10.000000' },
    };
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string) => {
        if (url.includes('/v1/balances'))
          return expired
            ? new Response('', { status })
            : Response.json({
                balances: [
                  {
                    available: { currency: 'USD', amount: '1000' },
                    reserved: { currency: 'USD', amount: '0' },
                  },
                ],
              });
        return Response.json(url.includes('/v1/payments/') ? { payment } : { payments: [payment] });
      }),
    );
    const client = setup();
    expect(await screen.findByText('+10 USDT')).toBeVisible();
    fireEvent.click(screen.getByRole('button', { name: /10 USDT/ }));
    await waitFor(() => expect(screen.getByRole('dialog')).toBeVisible());
    expired = true;
    await act(async () => {
      await client.refetchQueries({ queryKey: ['client-asset', 'balance'] });
    });
    await waitFor(() => expect(router.replace).toHaveBeenCalledWith('/account'));
    expect(screen.queryByText('+10 USDT')).not.toBeInTheDocument();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    await waitFor(() => expect(client.getQueryData(['payment', 'history'])).toBeUndefined());
    expect(client.getQueryData(['client-asset', 'balance'])).toBeUndefined();
    client.clear();
  },
);

it('keeps session verification failures retryable without redirecting to login', async () => {
  vi.mocked(authApi.session).mockRejectedValue(new Error('unavailable'));
  const fetcher = vi.fn();
  vi.stubGlobal('fetch', fetcher);
  const client = setup();
  expect(await screen.findByRole('alert')).toBeVisible();
  expect(router.replace).not.toHaveBeenCalled();
  expect(fetcher).not.toHaveBeenCalled();
  client.clear();
});

it('hides KYC and clears private data when a KYC save rejects the session', async () => {
  vi.stubEnv('NEXT_PUBLIC_ATLAS_BACKEND_URL', 'http://localhost:8080');
  vi.mocked(authApi.session).mockResolvedValue({ authenticated: true });
  vi.stubGlobal(
    'fetch',
    vi.fn(async (_url: string, init?: RequestInit) =>
      init?.method === 'PUT'
        ? new Response('', { status: 401 })
        : Response.json({
            level: 'KYC_LEVEL_UNVERIFIED',
          }),
    ),
  );
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <MantineProvider>
      <IntlProvider locale="ru" messages={messages}>
        <QueryClientProvider client={client}>
          <AccountAccess>
            <ProfileKYC />
          </AccountAccess>
        </QueryClientProvider>
      </IntlProvider>
    </MantineProvider>,
  );
  fireEvent.click(await screen.findByRole('button', { name: messages['kyc.start'] }));
  const email = await screen.findByLabelText(messages['kyc.email'], { exact: false });
  fireEvent.change(screen.getByRole('combobox'), { target: { value: 'RU' } });
  fireEvent.submit(email.closest('form')!);
  await waitFor(() => expect(router.replace).toHaveBeenCalledWith('/account'));
  expect(screen.queryByDisplayValue('private@example.com')).not.toBeInTheDocument();
  expect(client.getQueryData(['kyc'])).toBeUndefined();
  client.clear();
});
