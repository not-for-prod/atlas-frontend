import { afterEach, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MantineProvider } from '@mantine/core';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { IntlProvider } from 'react-intl';
import messages from '../../../dictionaries/ru.json';
import { authApi } from '~/entities/auth';
import { AccountAccess } from '~/features/AccountAccess';
import { BalanceVisibilityProvider } from '~/shared/ui/BalanceVisibilityProvider';
import { Logout } from './Logout';

const router = vi.hoisted(() => ({ replace: vi.fn() }));
vi.mock('next/navigation', () => ({ useRouter: () => router }));
vi.mock('~/entities/auth', () => ({ authApi: { session: vi.fn(), logout: vi.fn() } }));
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});
function setup() {
  vi.mocked(authApi.session).mockResolvedValue({ authenticated: true });
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  for (const key of ['client-asset', 'payment', 'kyc', 'card'])
    client.setQueryData([key, 'private'], { secret: 'account data' });
  render(
    <MantineProvider>
      <IntlProvider locale="ru" messages={messages}>
        <QueryClientProvider client={client}>
          <BalanceVisibilityProvider>
            <AccountAccess>
              <p>Private account content</p>
              <Logout />
            </AccountAccess>
          </BalanceVisibilityProvider>
        </QueryClientProvider>
      </IntlProvider>
    </MantineProvider>,
  );
  return client;
}
it('hides account content, cancels pending private reads, clears caches and replaces the route after logout', async () => {
  vi.mocked(authApi.logout).mockResolvedValue({ authenticated: false });
  const client = setup();
  const button = await screen.findByRole('button', { name: messages['auth.logout'] });
  let signal: AbortSignal | undefined;
  void client
    .fetchQuery({
      queryKey: ['payment', 'pending'],
      queryFn: ({ signal: requestSignal }) => {
        signal = requestSignal;
        return new Promise(() => {});
      },
    })
    .catch(() => {});
  fireEvent.click(button);
  await waitFor(() => expect(router.replace).toHaveBeenCalledWith('/account'));
  expect(authApi.logout).toHaveBeenCalledTimes(1);
  expect(screen.queryByText('Private account content')).not.toBeInTheDocument();
  expect(signal?.aborted).toBe(true);
  for (const key of ['client-asset', 'payment', 'kyc', 'card'])
    expect(client.getQueryCache().findAll({ queryKey: [key] })).toHaveLength(0);
  expect(client.getQueryData(['auth', 'cabinet'])).toEqual({ authenticated: false });
  expect(client.getQueryData(['auth', 'session'])).toEqual({ authenticated: false });
  client.clear();
});
it('keeps the account available and allows explicit retry when logout fails', async () => {
  vi.mocked(authApi.logout).mockRejectedValueOnce(new Error('unavailable'));
  const client = setup();
  fireEvent.click(await screen.findByRole('button', { name: messages['auth.logout'] }));
  expect(await screen.findByRole('alert')).toBeVisible();
  expect(router.replace).not.toHaveBeenCalled();
  expect(screen.getByText('Private account content')).toBeVisible();
  expect(client.getQueryData(['card', 'private'])).toBeDefined();
  vi.mocked(authApi.logout).mockResolvedValueOnce({ authenticated: false });
  fireEvent.click(screen.getByRole('button', { name: messages['auth.logout'] }));
  await waitFor(() => expect(router.replace).toHaveBeenCalledWith('/account'));
  expect(authApi.logout).toHaveBeenCalledTimes(2);
  client.clear();
});
