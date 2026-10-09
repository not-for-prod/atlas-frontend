import { expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import messages from '../../../../../dictionaries/ru.json';
import { PaymentReceipt } from './PaymentReceipt';
it.each(['PAYMENT_TYPE_CARD_ISSUE', 'PAYMENT_TYPE_CARD_TOP_UP'] as const)(
  'shows a failed %s charge and returned funds without deposit income',
  (type) => {
    render(
      <IntlProvider locale="ru" messages={messages}>
        <PaymentReceipt
          payment={{
            id: 'card-issue:order',
            type,
            status: 'PAYMENT_STATUS_FAILED',
            createdAt: '2026-09-30T12:00:00Z',
            amount: { currency: 'USD', amount: '5.00' },
            fee: { currency: 'USD', amount: '5.00' },
            reservedAmount: { currency: 'USD', amount: '0.00' },
            releasedAmount: { currency: 'USD', amount: '20.00' },
          }}
        />
      </IntlProvider>,
    );
    expect(screen.getByText('−5,00 USD')).toBeVisible();
    expect(screen.getByText('20,00 USD')).toBeVisible();
    expect(screen.getByText(messages['payment.released'])).toBeVisible();
    expect(
      screen.getByText(
        messages[type === 'PAYMENT_TYPE_CARD_TOP_UP' ? 'history.cardTopUp' : 'history.cardIssue'],
      ),
    ).toBeVisible();
    expect(screen.queryByText(messages['payment.credited'])).toBeNull();
    expect(screen.queryByRole('img', { name: 'USDT · TRON' })).toBeNull();
  },
);

it.each(['PAYMENT_STATUS_PENDING', 'PAYMENT_STATUS_COMPLETED', 'PAYMENT_STATUS_FAILED'] as const)(
  'shows SBP receipt status %s without crypto instructions or a separate Atlas fee',
  (status) => {
    render(
      <IntlProvider locale="ru" messages={messages}>
        <PaymentReceipt
          payment={{
            id: 'sbp:order',
            type: 'PAYMENT_TYPE_DEPOSIT',
            status,
            createdAt: '2026-10-07T14:54:33Z',
            amount: { currency: 'USD', amount: '100.25' },
            creditedAmount:
              status === 'PAYMENT_STATUS_COMPLETED' ? { currency: 'USD', amount: '100.25' } : undefined,
          }}
        />
      </IntlProvider>,
    );
    expect(screen.getByText(messages['history.sbpDeposit'])).toBeVisible();
    expect(screen.getByRole('img', { name: 'СБП' })).toBeVisible();
    expect(screen.queryByRole('img', { name: 'USDT · TRON' })).toBeNull();
    expect(screen.queryByText(messages['payment.network'])).toBeNull();
    expect(screen.queryByText(messages['payment.fee'])).toBeNull();
    if (status !== 'PAYMENT_STATUS_COMPLETED') {
      expect(screen.getByText('100,25 USD', { exact: true })).toBeVisible();
      expect(screen.queryByText('+100,25 USD')).toBeNull();
    } else {
      expect(screen.getByText('+100,25 USD')).toBeVisible();
    }
  },
);
