import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MantineProvider } from '@mantine/core';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { IntlProvider } from 'react-intl';
import messages from '../../../dictionaries/ru.json';
import { CryptoDeposit } from './CryptoDeposit';

const push = vi.hoisted(() => vi.fn());
vi.mock('next/navigation', () => ({ useRouter: () => ({ push }) }));
beforeEach(() => vi.stubEnv('NEXT_PUBLIC_ATLAS_BACKEND_URL', 'http://localhost:8080'));
afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  vi.clearAllMocks();
});
function mount() {
  return render(
    <MantineProvider>
      <IntlProvider locale="ru" messages={messages}>
        <QueryClientProvider client={new QueryClient()}>
          <ul>
            <CryptoDeposit onClose={vi.fn()} />
          </ul>
        </QueryClientProvider>
      </IntlProvider>
    </MantineProvider>,
  );
}
it('shows an unavailable alert and retries with the original request key', async () => {
  const fetcher = vi
    .fn()
    .mockResolvedValueOnce(new Response(JSON.stringify({ code: 14 }), { status: 503 }))
    .mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          walletId: 'wallet',
          requisite: { currency: 'USDT', network: 'tron', address: 'destination' },
        }),
      ),
    );
  vi.stubGlobal('fetch', fetcher);
  const user = userEvent.setup();
  mount();
  await user.click(screen.getByRole('button', { name: /Получить адрес/ }));
  const alert = await screen.findByRole('alert');
  expect(alert).toHaveTextContent(messages['crypto.unavailable']);
  expect(alert).not.toHaveTextContent(messages['crypto.unknown']);
  await user.click(within(alert).getByRole('button', { name: messages['crypto.retry'] }));
  expect(await screen.findByDisplayValue('destination')).toBeVisible();
  expect(fetcher).toHaveBeenCalledTimes(2);
  expect(fetcher.mock.calls[1][1].body).toBe(fetcher.mock.calls[0][1].body);
  expect(screen.queryByRole('alert')).not.toBeInTheDocument();
});
it.each(['timeout', 'pending'])('shows an explicit check action for %s', async (failure) => {
  vi.stubGlobal(
    'fetch',
    failure === 'timeout'
      ? vi.fn().mockRejectedValue(new Error('timeout'))
      : vi.fn().mockResolvedValue(new Response(JSON.stringify({ code: 9 }), { status: 400 })),
  );
  const user = userEvent.setup();
  mount();
  await user.click(screen.getByRole('button', { name: /Получить адрес/ }));
  const alert = await screen.findByRole('alert');
  expect(alert).toHaveTextContent(messages['crypto.unknown']);
  expect(within(alert).getByRole('button', { name: messages['crypto.check'] })).toBeVisible();
});
it('offers sign-in when the session is missing', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('', { status: 401 })));
  const user = userEvent.setup();
  mount();
  await user.click(screen.getByRole('button', { name: /Получить адрес/ }));
  const alert = await screen.findByRole('alert');
  expect(alert).toHaveTextContent(messages['crypto.signIn']);
  await user.click(within(alert).getByRole('button', { name: messages['auth.signIn'] }));
  expect(push).toHaveBeenCalledWith('/account');
});
