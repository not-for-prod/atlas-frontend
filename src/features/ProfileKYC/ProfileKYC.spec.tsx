import { afterEach, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MantineProvider } from '@mantine/core';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { IntlProvider } from 'react-intl';
import messages from '../../../dictionaries/ru.json';
import { ProfileKYC } from './ProfileKYC';
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});
function setup(cardTypeId?: string) {
  vi.stubEnv('NEXT_PUBLIC_ATLAS_BACKEND_URL', 'http://localhost:8080');
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  render(
    <MantineProvider>
      <IntlProvider locale="ru" messages={messages}>
        <QueryClientProvider client={client}>
          <ProfileKYC cardTypeId={cardTypeId} />
        </QueryClientProvider>
      </IntlProvider>
    </MantineProvider>,
  );
  return client;
}
/** @tags kyc contacts @description Failed saves retain edits; successful saves hide personal data. */
it('collects only email and refreshes status after saving', async () => {
  let fail = true,
    saved = false;
  const fetcher = vi.fn(async (_url: string, init?: RequestInit) => {
    if (init?.method === 'PUT') {
      if (fail) return new Response('', { status: 503 });
      saved = true;
    }
    return Response.json({ state: { status: 'VERIFICATION_STATUS_NOT_STARTED', contactsComplete: saved } });
  });
  vi.stubGlobal('fetch', fetcher);
  const client = setup();
  fireEvent.click(await screen.findByRole('button', { name: messages['kyc.addContacts'] }));
  const email = await screen.findByLabelText(messages['kyc.email'], { exact: false });
  fireEvent.change(email, { target: { value: 'edited@example.com' } });
  expect(screen.queryByLabelText('Телефон', { exact: false })).not.toBeInTheDocument();
  expect(screen.queryByLabelText('Номер паспорта', { exact: false })).not.toBeInTheDocument();
  fireEvent.submit(email.closest('form')!);
  expect(await screen.findByRole('alert')).toHaveTextContent(messages['kyc.saveError']);
  expect(email).toHaveValue('edited@example.com');
  fail = false;
  fireEvent.submit(email.closest('form')!);
  expect(await screen.findByText(messages['kyc.contactsSaved'])).toBeVisible();
  await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  expect(
    JSON.parse(fetcher.mock.calls.find(([, init]) => init?.method === 'PUT')![1]!.body as string),
  ).toEqual({ email: 'edited@example.com' });
  expect(JSON.stringify(client.getQueryData(['kyc', '']))).not.toContain('edited@example.com');
  expect(window.localStorage.length).toBe(0);
  expect(window.sessionStorage.length).toBe(0);
  client.clear();
});
it('shows a retryable error and starts no session merely by opening a profile', async () => {
  const fetcher = vi
    .fn()
    .mockResolvedValueOnce(new Response('', { status: 503 }))
    .mockImplementation(() =>
      Promise.resolve(Response.json({ state: { status: 'VERIFICATION_STATUS_NOT_STARTED' } })),
    );
  vi.stubGlobal('fetch', fetcher);
  const client = setup();
  expect(await screen.findByRole('alert')).toHaveTextContent(messages['kyc.loadError']);
  fireEvent.click(screen.getByRole('button', { name: messages['kyc.retry'] }));
  expect(await screen.findByRole('link', { name: messages['kyc.chooseCard'] })).toHaveAttribute(
    'href',
    '/cabinet/issue',
  );
  expect(screen.queryByRole('button', { name: messages['kyc.start'] })).not.toBeInTheDocument();
  expect(fetcher.mock.calls.every(([, init]) => !init.method)).toBe(true);
  client.clear();
});
it('does not repeat identity verification when only contacts are missing', async () => {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockImplementation(() =>
      Promise.resolve(
        Response.json({
          state: {
            status: 'VERIFICATION_STATUS_APPROVED',
            contactsComplete: false,
            eligible: false,
            passedChecks: ['KYC_CHECK_IDENTITY_DOCUMENT'],
            requiredChecks: ['KYC_CHECK_IDENTITY_DOCUMENT'],
          },
        }),
      ),
    ),
  );
  const client = setup('travel');
  expect(await screen.findByText(messages['kyc.finishContacts'])).toBeVisible();
  expect(screen.queryByRole('button', { name: messages['kyc.start'] })).not.toBeInTheDocument();
  expect(screen.getByRole('button', { name: messages['kyc.addContacts'] })).toBeVisible();
  client.clear();
});
it('offers a new check when approval does not cover this card requirements', async () => {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockImplementation(() =>
      Promise.resolve(
        Response.json({
          state: {
            status: 'VERIFICATION_STATUS_APPROVED',
            contactsComplete: true,
            eligible: false,
            requiredChecks: ['KYC_CHECK_LIVENESS'],
            missingChecks: ['KYC_CHECK_LIVENESS'],
          },
        }),
      ),
    ),
  );
  const client = setup('travel');
  expect(await screen.findByRole('button', { name: messages['kyc.start'] })).toBeVisible();
  expect(screen.getByText(messages['kyc.checkMissing'])).toBeVisible();
  client.clear();
});
