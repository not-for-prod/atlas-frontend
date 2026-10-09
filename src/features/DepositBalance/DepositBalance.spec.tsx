import { afterEach, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MantineProvider } from '@mantine/core';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { IntlProvider } from 'react-intl';
import messages from '../../../dictionaries/ru.json';
import { DepositBalance } from './DepositBalance';

vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn() }) }));
afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});
function mount() {
  render(
    <MantineProvider>
      <IntlProvider locale="ru" messages={messages}>
        <QueryClientProvider client={new QueryClient()}>
          <DepositBalance onClose={vi.fn()} />
        </QueryClientProvider>
      </IntlProvider>
    </MantineProvider>,
  );
}
it('shows crypto details and requests an address only after selecting crypto', async () => {
  vi.stubEnv('NEXT_PUBLIC_ATLAS_BACKEND_URL', 'http://localhost:8080');
  const fetcher = vi.fn().mockResolvedValue(
    new Response(
      JSON.stringify({
        walletId: 'wallet',
        requisite: { address: 'destination', currency: 'USDT', network: 'tron' },
      }),
    ),
  );
  vi.stubGlobal('fetch', fetcher);
  const user = userEvent.setup();
  mount();
  expect(screen.queryByText(messages['cabinet.deposit.crypto'])).not.toBeInTheDocument();
  const input = screen.getByLabelText(messages['deposit.amount']);
  await user.type(input, '100,25');
  await user.click(screen.getByRole('button', { name: messages['deposit.continue'] }));
  expect(screen.getByText('100,25 $')).toBeVisible();
  expect(screen.queryByText('100,25 USDT')).not.toBeInTheDocument();
  expect(screen.queryByText('0,00 $')).not.toBeInTheDocument();
  expect(screen.queryByText(messages['deposit.networkFee'])).not.toBeInTheDocument();
  expect(screen.getByRole('button', { name: /СБП/ })).toBeVisible();
  expect(fetcher).not.toHaveBeenCalled();
  await user.click(screen.getByRole('button', { name: messages['deposit.editAmount'] }));
  expect(screen.getByLabelText(messages['deposit.amount'])).toHaveValue('100,25');
  await user.clear(screen.getByLabelText(messages['deposit.amount']));
  await user.type(screen.getByLabelText(messages['deposit.amount']), '90071992547409.93');
  await user.click(screen.getByRole('button', { name: messages['deposit.continue'] }));
  expect(screen.queryByText('90 071 992 547 409,93 USDT')).not.toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: /Получить адрес/ }));
  expect(screen.getByText('90 071 992 547 409,93 USDT')).toBeVisible();
  expect(screen.queryByRole('button', { name: /СБП/ })).not.toBeInTheDocument();
  expect(screen.getByRole('heading', { name: 'USDT' })).toHaveFocus();
  expect(screen.getByText('0,00 $')).toBeVisible();
  expect(screen.getByText(messages['deposit.networkFee'])).toBeVisible();
  expect(await screen.findByDisplayValue('destination')).toBeVisible();
  expect(fetcher).toHaveBeenCalledTimes(1);
  expect(JSON.parse(fetcher.mock.calls[0][1].body)).toEqual({
    idempotencyKey: expect.any(String),
    currency: 'USDT',
    network: 'tron',
  });
});
it.each(['0', '-1', '1.001', '1e2', 'NaN'])(
  'rejects invalid net USD input %s before showing methods',
  async (amount) => {
    const user = userEvent.setup();
    mount();
    await user.type(screen.getByLabelText(messages['deposit.amount']), amount);
    await user.click(screen.getByRole('button', { name: messages['deposit.continue'] }));
    expect(screen.getByText(messages['deposit.invalidAmount'])).toBeVisible();
    expect(screen.queryByText(messages['cabinet.deposit.crypto'])).not.toBeInTheDocument();
  },
);
