import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import { render, screen, act, within, waitFor } from '@testing-library/react';
import { MantineProvider } from '@mantine/core';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { IntlProvider } from 'react-intl';
import messages from '../../../dictionaries/ru.json';
import { PaymentHistory } from './PaymentHistory';

beforeEach(() => vi.stubEnv('NEXT_PUBLIC_ATLAS_BACKEND_URL', 'http://localhost:8080'));
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});
it('shows each deposit status without claiming all deposits are confirmed', async () => {
  const statuses = ['PENDING', 'INSPECTION', 'COMPLETED', 'FAILED'];
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          payments: statuses.map((status) => ({
            id: status,
            type: 'PAYMENT_TYPE_DEPOSIT',
            status: `PAYMENT_STATUS_${status}`,
            createdAt: '2026-09-27T00:00:00Z',
            amount: { currency: 'USDT', amount: '1.234567' },
          })),
        }),
      ),
    ),
  );
  const client = new QueryClient();
  const view = render(
    <MantineProvider>
      <IntlProvider locale="ru" messages={messages}>
        <QueryClientProvider client={client}>
          <PaymentHistory />
        </QueryClientProvider>
      </IntlProvider>
    </MantineProvider>,
  );
  for (const key of ['crypto.pending', 'crypto.inspection', 'crypto.failed'] as const) {
    expect(await screen.findByText(messages[key])).toBeVisible();
  }
  expect(screen.getAllByText('+1,234567 USDT')).toHaveLength(1);
  expect(screen.getAllByText('1,234567 USDT')).toHaveLength(3);
  expect(screen.getAllByRole('listitem')).toHaveLength(4);
  expect(screen.getAllByRole('heading', { level: 3 })).toHaveLength(1);
  expect(screen.getAllByRole('img', { name: 'USDT · TRON' })).toHaveLength(4);
  view.unmount();
  client.clear();
});

it('uses SBP status copy while preserving crypto statuses in mixed history', async () => {
  const statuses = ['PENDING', 'INSPECTION', 'FAILED'];
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          payments: ['USD', 'USDT'].flatMap((currency) =>
            statuses.map((status) => ({
              id: `${currency}-${status}`,
              type: 'PAYMENT_TYPE_DEPOSIT',
              status: `PAYMENT_STATUS_${status}`,
              createdAt: '2026-10-07T00:00:00Z',
              amount: { currency, amount: '100' },
            })),
          ),
        }),
      ),
    ),
  );
  const client = new QueryClient();
  const view = render(
    <MantineProvider>
      <IntlProvider locale="ru" messages={messages}>
        <QueryClientProvider client={client}>
          <PaymentHistory />
        </QueryClientProvider>
      </IntlProvider>
    </MantineProvider>,
  );
  for (const method of ['sbp', 'crypto'] as const) {
    for (const status of ['pending', 'inspection', 'failed'] as const) {
      expect(await screen.findByText(messages[`${method}.${status}`])).toBeVisible();
    }
  }
  const sbpRows = screen.getAllByRole('listitem').filter((row) => row.textContent?.includes('СБП'));
  expect(sbpRows).toHaveLength(3);
  for (const row of sbpRows) {
    expect(within(row).queryByText(/Криптопоступление/)).not.toBeInTheDocument();
  }
  view.unmount();
  client.clear();
});

it('keeps unavailable card history separate from cached account payments and does not poll', async () => {
  vi.useFakeTimers();
  const fetcher = vi.fn();
  vi.stubGlobal('fetch', fetcher);
  const client = new QueryClient();
  client.setQueryData(['payment', 'history'], {
    pages: [
      {
        payments: [
          {
            id: 'account-deposit',
            type: 'PAYMENT_TYPE_DEPOSIT',
            status: 'PAYMENT_STATUS_COMPLETED',
            createdAt: '2026-09-27T00:00:00Z',
            amount: { currency: 'USDT', amount: '1.000000' },
          },
        ],
        nextPageToken: 'account-next-page',
      },
    ],
    pageParams: [''],
  });
  const view = render(
    <MantineProvider>
      <IntlProvider locale="ru" messages={messages}>
        <QueryClientProvider client={client}>
          <PaymentHistory
            titleMessage="cabinet.card.operations"
            unavailableMessage="cabinet.card.operationsUnavailable"
          />
        </QueryClientProvider>
      </IntlProvider>
    </MantineProvider>,
  );
  expect(screen.getByRole('heading', { name: messages['cabinet.card.operations'] })).toBeVisible();
  expect(screen.getByText(messages['cabinet.card.operationsUnavailable'])).toBeVisible();
  expect(screen.queryByRole('listitem')).not.toBeInTheDocument();
  expect(screen.queryByRole('button', { name: messages['crypto.refresh'] })).not.toBeInTheDocument();
  expect(screen.queryByRole('button', { name: messages['crypto.more'] })).not.toBeInTheDocument();
  await act(async () => {
    await vi.advanceTimersByTimeAsync(30000);
  });
  expect(fetcher).not.toHaveBeenCalled();
  view.unmount();
  client.clear();
});

it('shows card operations without requesting or exposing cached wallet history', async () => {
  const fetcher = vi.fn().mockResolvedValue(
    new Response(
      JSON.stringify({
        operations: [
          {
            id: 'purchase',
            type: 'CARD_OPERATION_TYPE_PURCHASE',
            status: 'CARD_OPERATION_STATUS_AUTHORIZED',
            amount: { amount: '1.123456', currency: 'EUR' },
            merchantName: 'Online merchant',
            transactionTime: '2026-10-03T12:00:00Z',
          },
          {
            id: 'refund',
            type: 'CARD_OPERATION_TYPE_REFUND',
            status: 'CARD_OPERATION_STATUS_COMPLETED',
            amount: { amount: '2', currency: 'USD' },
            transactionTime: '2026-10-03T12:00:00Z',
          },
          {
            id: 'declined',
            type: 'CARD_OPERATION_TYPE_PURCHASE',
            status: 'CARD_OPERATION_STATUS_DECLINED',
            transactionTime: '2026-10-03T12:00:00',
          },
        ],
      }),
    ),
  );
  vi.stubGlobal('fetch', fetcher);
  const client = new QueryClient();
  client.setQueryData(['payment', 'history'], {
    pages: [
      {
        payments: [
          {
            id: 'wallet-only',
            amount: { amount: '999', currency: 'USDT' },
            status: 'PAYMENT_STATUS_COMPLETED',
            type: 'PAYMENT_TYPE_DEPOSIT',
          },
        ],
      },
    ],
    pageParams: [''],
  });
  const view = render(
    <MantineProvider>
      <IntlProvider locale="ru" messages={messages}>
        <QueryClientProvider client={client}>
          <PaymentHistory cardId="selected-card" titleMessage="cabinet.card.operations" />
        </QueryClientProvider>
      </IntlProvider>
    </MantineProvider>,
  );
  expect(await screen.findByText('Online merchant')).toBeVisible();
  expect(screen.getByText('Авторизована')).toBeVisible();
  expect(screen.getByText('Отклонена')).toBeVisible();
  expect(screen.getByText('1,123456 EUR')).toBeVisible();
  expect(screen.getByText('+2,00 USD')).toBeVisible();
  expect(screen.getByText('Сумма не указана')).toBeVisible();
  expect(screen.queryByText(/999/)).not.toBeInTheDocument();
  expect(screen.getAllByRole('listitem')).toHaveLength(3);
  expect(
    fetcher.mock.calls.every(([url]) => String(url).includes('/v1/cards/selected-card/operations')),
  ).toBe(true);
  expect(screen.queryByRole('button', { name: /Открыть платёж/ })).not.toBeInTheDocument();
  const user = userEvent.setup();
  const row = screen.getByRole('button', { name: 'Открыть операцию: Online merchant, purchase' });
  row.focus();
  await user.keyboard('{Enter}');
  const details = await screen.findByRole('dialog', { name: messages['cardOperation.details'] });
  expect(within(details).getByText('purchase')).toBeVisible();
  expect(within(details).getByText('1,123456 EUR')).toBeVisible();
  expect(within(details).getAllByText(messages['payment.notProvided'])).toHaveLength(2);
  await user.keyboard('{Escape}');
  await user.click(screen.getByRole('button', { name: 'Открыть операцию: Покупка, declined' }));
  const declined = await screen.findByRole('dialog');
  await waitFor(() => expect(within(declined).getByText('Отклонена')).toBeVisible());
  expect(within(declined).getByText('2026-10-03T12:00:00')).toBeVisible();
  expect(within(declined).getByText('Сумма не указана')).toBeVisible();
  expect(
    fetcher.mock.calls.every(([url]) => String(url).includes('/v1/cards/selected-card/operations')),
  ).toBe(true);
  view.unmount();
  client.clear();
});

it('uses payment status labels for issuance and card top-ups in account history', async () => {
  const statuses = ['PENDING', 'INSPECTION', 'FAILED'];
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          payments: ['CARD_ISSUE', 'CARD_TOP_UP'].flatMap((type) =>
            statuses.map((status) => ({
              id: `${type}-${status}`,
              type: `PAYMENT_TYPE_${type}`,
              status: `PAYMENT_STATUS_${status}`,
              createdAt: '2026-10-09T06:55:00Z',
              amount: { currency: 'USD', amount: '1' },
              fee: { currency: 'USD', amount: '1' },
              reservedAmount: { currency: 'USD', amount: '0' },
              releasedAmount: { currency: 'USD', amount: '0' },
            })),
          ),
        }),
      ),
    ),
  );
  const client = new QueryClient();
  const view = render(
    <MantineProvider>
      <IntlProvider locale="ru" messages={messages}>
        <QueryClientProvider client={client}>
          <PaymentHistory />
        </QueryClientProvider>
      </IntlProvider>
    </MantineProvider>,
  );
  expect(await screen.findAllByText('Не выполнен')).toHaveLength(2);
  expect(screen.getAllByText('Ожидает подтверждения')).toHaveLength(2);
  expect(screen.getAllByText('На проверке')).toHaveLength(2);
  expect(screen.getAllByText(messages['history.cardIssue'])).toHaveLength(3);
  expect(screen.getAllByText(messages['history.cardTopUp'])).toHaveLength(3);
  expect(screen.queryByText(/Криптопоступление/)).not.toBeInTheDocument();
  expect(screen.getAllByText('−1,00 USD')).toHaveLength(2);
  view.unmount();
  client.clear();
});
