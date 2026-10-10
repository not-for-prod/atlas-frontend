import { afterEach, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MantineProvider } from '@mantine/core';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { IntlProvider } from 'react-intl';
import { type CardCategory, type CardIssue } from '~/entities/card';
import messages from '../../../dictionaries/ru.json';
import { IssueCard } from './IssueCard';
const flow = vi.hoisted(() => ({
  locked: false,
  loading: false,
  unavailable: false,
  issue: undefined as CardIssue | undefined,
  submit: vi.fn(),
  refresh: vi.fn(),
  mutation: { isError: false, isPending: false },
  progress: { isError: false, refetch: vi.fn() },
}));
vi.mock('./lib/hooks/useIssueCard', () => ({ useIssueCard: () => flow }));
vi.mock('~/shared/api/backendOrigin', () => ({ backendOrigin: () => 'https://atlas.test' }));
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  flow.submit.mockClear();
  flow.issue = undefined;
});
const category: CardCategory = {
  id: 'travel',
  description: '',
  requiresKyc: true,
  fees: { issue_price: { fixed: '20' }, issue_commission: { fixed: '5' } },
};
function setup(card: CardCategory) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <MantineProvider>
      <IntlProvider locale="ru" messages={messages}>
        <QueryClientProvider client={client}>
          <IssueCard category={card} onLocked={vi.fn()} verification={<p>KYC gate</p>} />
        </QueryClientProvider>
      </IntlProvider>
    </MantineProvider>,
  );
  return client;
}
/** @tags kyc issuance @description Backend eligibility gates submission independently from the identity status. */
it('keeps issuance blocked for approved identity with missing contacts', async () => {
  const fetcher = vi.fn().mockResolvedValue(
    Response.json({
      state: {
        status: 'VERIFICATION_STATUS_APPROVED',
        eligible: false,
        contactsComplete: false,
      },
    }),
  );
  vi.stubGlobal('fetch', fetcher);
  const client = setup(category);
  expect(await screen.findByText('KYC gate')).toBeVisible();
  expect(screen.queryByRole('button', { name: messages['issuance.submit'] })).not.toBeInTheDocument();
  expect(flow.submit).not.toHaveBeenCalled();
  client.clear();
});
it('allows explicit issuance after backend eligibility, never submits automatically', async () => {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue(
      Response.json({
        state: {
          status: 'VERIFICATION_STATUS_APPROVED',
          eligible: true,
          contactsComplete: true,
        },
      }),
    ),
  );
  const client = setup(category);
  const input = await screen.findByLabelText(messages['issuance.name'], { exact: false });
  expect(flow.submit).not.toHaveBeenCalled();
  fireEvent.change(input, { target: { value: 'Поездки' } });
  fireEvent.click(screen.getByRole('button', { name: messages['issuance.submit'] }));
  expect(flow.submit).toHaveBeenCalledWith('travel', 'Поездки', '20', '5');
  client.clear();
});
it('skips all KYC reads for an exempt card', async () => {
  const fetcher = vi.fn();
  vi.stubGlobal('fetch', fetcher);
  const client = setup({ ...category, requiresKyc: false });
  expect(await screen.findByLabelText(messages['issuance.name'], { exact: false })).toBeVisible();
  expect(fetcher).not.toHaveBeenCalled();
  client.clear();
});
it('shows an admitted order without requiring a new KYC read', async () => {
  const fetcher = vi.fn();
  vi.stubGlobal('fetch', fetcher);
  flow.issue = {
    id: 'admitted',
    name: 'Поездки',
    cardTypeId: 'travel',
    status: 'CARD_ISSUE_STATUS_PENDING',
    price: { currency: 'USD', amount: '20' },
    fee: { currency: 'USD', amount: '5' },
  };
  const client = setup(category);
  expect(await screen.findByText(messages['issuance.CARD_ISSUE_STATUS_PENDING'])).toBeVisible();
  expect(fetcher).not.toHaveBeenCalled();
  expect(screen.queryByText('KYC gate')).not.toBeInTheDocument();
  client.clear();
});
