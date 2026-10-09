import { act, render, screen } from '@testing-library/react';
import { MantineProvider } from '@mantine/core';
import { IntlProvider } from 'react-intl';
import { afterEach, expect, it, vi } from 'vitest';
import messages from '../../../../../../../dictionaries/ru.json';
import { SbpQr } from './SbpQr';
const query = vi.hoisted(() => vi.fn());
vi.mock('~/entities/payment', () => ({ useSbpPaymentQr: query }));
afterEach(() => {
  vi.useRealTimers();
  vi.clearAllMocks();
});
function mount() {
  render(
    <MantineProvider>
      <IntlProvider locale="ru" messages={messages}>
        <SbpQr paymentId="original-payment" />
      </IntlProvider>
    </MantineProvider>,
  );
}
it('renders the direct QR and removes payment access at its provider expiry', async () => {
  vi.useFakeTimers();
  const url = 'https://qr.nspk.ru/ABCD1234?sum=100001';
  query.mockReturnValue({
    isPending: false,
    isError: false,
    data: { status: 'SBP_QR_STATUS_AVAILABLE', url, expiresAt: new Date(Date.now() + 1000).toISOString() },
  });
  mount();
  expect(screen.getByRole('img', { name: messages['sbp.qrLabel'] })).toBeVisible();
  expect(screen.getByRole('link', { name: messages['sbp.openBank'] })).toHaveAttribute('href', url);
  await act(async () => {
    vi.advanceTimersByTime(1001);
  });
  expect(screen.queryByRole('img')).not.toBeInTheDocument();
  expect(screen.queryByRole('link')).not.toBeInTheDocument();
  expect(screen.getByText(messages['sbp.qrExpired'])).toBeVisible();
  expect(query).toHaveBeenCalledWith('original-payment');
});
it.each([
  ['SBP_QR_STATUS_PENDING', 'sbp.qrPreparing'],
  ['SBP_QR_STATUS_CHECKOUT_REQUIRED', 'sbp.qrCheckout'],
  ['SBP_QR_STATUS_EXPIRED', 'sbp.qrExpired'],
])('keeps %s as explicit access state without a fake QR', (status, message) => {
  query.mockReturnValue({ isPending: false, isError: false, data: { status } });
  mount();
  expect(screen.getByText(messages[message as keyof typeof messages])).toBeVisible();
  expect(screen.queryByRole('img')).not.toBeInTheDocument();
});
it('offers the checkout fallback when the QR read fails', () => {
  query.mockReturnValue({ isPending: false, isError: true });
  mount();
  expect(screen.getByText(messages['sbp.qrUnavailable'])).toBeVisible();
  expect(screen.queryByRole('img')).not.toBeInTheDocument();
});
