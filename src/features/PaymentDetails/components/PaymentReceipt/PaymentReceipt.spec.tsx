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
