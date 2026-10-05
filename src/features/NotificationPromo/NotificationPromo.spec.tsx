import { afterEach, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MantineProvider } from '@mantine/core';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { IntlProvider } from 'react-intl';
import messages from '../../../dictionaries/ru.json';
import { NotificationPromo } from './NotificationPromo';
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});
function setup() {
  vi.stubEnv('NEXT_PUBLIC_ATLAS_BACKEND_URL', 'http://localhost:8080');
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  render(
    <MantineProvider>
      <IntlProvider locale="ru" messages={messages}>
        <QueryClientProvider client={client}>
          <NotificationPromo />
        </QueryClientProvider>
      </IntlProvider>
    </MantineProvider>,
  );
  return client;
}
it('dismisses only after the false preference is saved, and keeps the promo after failure', async () => {
  let enabled = true;
  let fail = true;
  vi.stubGlobal(
    'fetch',
    vi.fn(async (_url: string, init?: RequestInit) => {
      if (init?.method === 'PUT') {
        if (fail) return new Response('', { status: 503 });
        enabled = false;
      }
      return Response.json({ enabled, telegramConnected: false, connectionAvailable: true });
    }),
  );
  const client = setup();
  fireEvent.click(await screen.findByRole('button', { name: messages['notification.promo.close'] }));
  expect(await screen.findByRole('alert')).toHaveTextContent(messages['notification.saveError']);
  expect(screen.getByRole('link', { name: messages['notification.promo.title'] })).toHaveAttribute(
    'href',
    '/cabinet/profile',
  );
  expect(screen.getByRole('link')).not.toContainElement(
    screen.getByRole('button', { name: messages['notification.promo.close'] }),
  );
  expect(screen.queryByRole('button', { name: messages['notification.connect'] })).not.toBeInTheDocument();
  fail = false;
  fireEvent.click(screen.getByRole('button', { name: messages['notification.promo.close'] }));
  await waitFor(() =>
    expect(
      screen.queryByRole('button', { name: messages['notification.promo.close'] }),
    ).not.toBeInTheDocument(),
  );
  expect(client.getQueryData(['notification', 'settings'])).toMatchObject({ enabled: false });
  client.clear();
});
it.each([
  { enabled: false, telegramConnected: false },
  { enabled: true, telegramConnected: true },
])('hides promo for saved settings %j', async (settings) => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json(settings)));
  const client = setup();
  await waitFor(() => expect(client.getQueryData(['notification', 'settings'])).toBeDefined());
  expect(screen.queryByRole('link')).not.toBeInTheDocument();
  client.clear();
});
