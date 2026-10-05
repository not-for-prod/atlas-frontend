import { afterEach, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MantineProvider } from '@mantine/core';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { IntlProvider } from 'react-intl';
import messages from '../../../dictionaries/ru.json';
import { RevealCard } from './RevealCard';

vi.mock('~/shared/api/backendOrigin', () => ({ backendOrigin: () => 'https://atlas.test' }));
afterEach(() => vi.unstubAllGlobals());
const card = { id: 'card', cardTypeId: 'travel', currency: 'USD', status: 'CARD_STATUS_ACTIVE' };
// Synthetic values only; these are not usable payment credentials.
const requisites = {
  number: 'TEST-NUMBER',
  securityCode: 'TEST-CVV',
  expirationMonth: '09',
  expirationYear: '2030',
  holderName: 'TEST HOLDER',
  billingAddress: {
    countryCode: 'SG',
    addressLine1: 'TEST ADDRESS',
    city: 'Singapore',
    postalCode: '000000',
  },
};
function setup() {
  const client = new QueryClient();
  const view = render(
    <MantineProvider>
      <IntlProvider locale="ru" messages={messages}>
        <QueryClientProvider client={client}>
          <RevealCard cardId="card" />
        </QueryClientProvider>
      </IntlProvider>
    </MantineProvider>,
  );
  return { client, ...view };
}
it('reveals server fields locally and never puts secrets in query or mutation data', async () => {
  const fetcher = vi.fn().mockResolvedValue(Response.json({ card, requisites }));
  vi.stubGlobal('fetch', fetcher);
  const { client, unmount } = setup();
  expect(await screen.findByText('TEST-NUMBER')).toBeVisible();
  expect(screen.getByText('TEST-CVV')).toBeVisible();
  expect(screen.getByText('TEST HOLDER')).toBeVisible();
  expect(screen.getByText(/09\/30/)).toBeVisible();
  expect(client.getQueryCache().getAll()).toHaveLength(0);
  expect(
    client
      .getMutationCache()
      .getAll()
      .every((mutation) => mutation.state.data === undefined),
  ).toBe(true);
  expect(localStorage.length).toBe(0);
  expect(sessionStorage.length).toBe(0);
  unmount();
  expect(screen.queryByText('TEST-NUMBER')).not.toBeInTheDocument();
  expect(fetcher.mock.calls[0][1].signal.aborted).toBe(true);
  client.clear();
});
it('shows unavailable fields without fabricating values and retries a failed read explicitly', async () => {
  const fetcher = vi
    .fn()
    .mockResolvedValueOnce(new Response('', { status: 503 }))
    .mockResolvedValueOnce(Response.json({ card }))
    .mockResolvedValue(Response.json({ card, requisites: { holderName: 'PARTIAL HOLDER' } }));
  vi.stubGlobal('fetch', fetcher);
  const { client } = setup();
  expect(await screen.findByRole('alert')).toHaveTextContent(messages['cabinet.card.requisitesError']);
  expect(fetcher).toHaveBeenCalledTimes(1);
  fireEvent.click(screen.getByRole('button', { name: messages['cabinet.card.requisitesRetry'] }));
  await waitFor(() =>
    expect(screen.getByRole('status')).toHaveTextContent(messages['cabinet.card.secretsUnavailable']),
  );
  fireEvent.click(screen.getByRole('button', { name: messages['cabinet.card.requisitesRetry'] }));
  expect(await screen.findByText('PARTIAL HOLDER')).toBeVisible();
  expect(screen.getByRole('button', { name: messages['cabinet.card.copyCvv'] })).toBeDisabled();
  expect(
    screen.queryByRole('button', { name: messages['cabinet.card.requisitesRetry'] }),
  ).not.toBeInTheDocument();
  client.clear();
});
it('aborts on hide and ignores a late response even if the transport resolves it', async () => {
  let resolve!: (response: Response) => void;
  const fetcher = vi.fn().mockImplementation(
    () =>
      new Promise<Response>((done) => {
        resolve = done;
      }),
  );
  vi.stubGlobal('fetch', fetcher);
  const { client, unmount } = setup();
  await waitFor(() => expect(fetcher).toHaveBeenCalledTimes(1));
  unmount();
  resolve(Response.json({ card, requisites }));
  await waitFor(() =>
    expect(
      client
        .getMutationCache()
        .getAll()
        .every((mutation) => mutation.state.data === undefined),
    ).toBe(true),
  );
  expect(fetcher.mock.calls[0][1].signal.aborted).toBe(true);
  expect(screen.queryByText('TEST-NUMBER')).not.toBeInTheDocument();
  client.clear();
});
it('preserves authentication rejection for the shared account gate', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('', { status: 401 })));
  const { client } = setup();
  await screen.findByRole('alert');
  expect(client.getMutationCache().getAll()[0].state.error).toMatchObject({ status: 401 });
  client.clear();
});

it('copies each available requisite using its payment-ready value', async () => {
  const writeText = vi.fn().mockResolvedValue(undefined);
  vi.stubGlobal('navigator', { ...navigator, clipboard: { writeText } });
  vi.stubGlobal(
    'fetch',
    vi
      .fn()
      .mockResolvedValue(Response.json({ card, requisites: { ...requisites, number: '0000000000001234' } })),
  );
  const { client } = setup();
  expect(await screen.findByText('0000 0000 0000 1234')).toBeVisible();
  for (const [label, value] of [
    ['cabinet.card.copyNumber', '0000000000001234'],
    ['cabinet.card.copyHolder', 'TEST HOLDER'],
    ['cabinet.card.copyBillingAddress', 'TEST ADDRESS'],
    ['cabinet.card.copyBillingCity', 'Singapore'],
    ['cabinet.card.copyBillingPostalCode', '000000'],
    ['cabinet.card.copyBillingCountry', 'Singapore'],
    ['cabinet.card.copyExpiry', '09/30'],
    ['cabinet.card.copyCvv', 'TEST-CVV'],
  ] as const) {
    fireEvent.click(screen.getByRole('button', { name: messages[label] }));
    await waitFor(() => expect(writeText).toHaveBeenLastCalledWith(value));
  }
  client.clear();
});
it('reports clipboard failure without claiming successful copying', async () => {
  vi.stubGlobal('navigator', {
    ...navigator,
    clipboard: { writeText: vi.fn().mockRejectedValue(new Error('denied')) },
  });
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json({ card, requisites })));
  const { client } = setup();
  await screen.findByText('TEST-NUMBER');
  fireEvent.click(screen.getByRole('button', { name: messages['cabinet.card.copyNumber'] }));
  await screen.findByText(messages['cabinet.card.copyError']);
  expect(screen.queryByText(messages['cabinet.card.copied'])).not.toBeInTheDocument();
  client.clear();
});
