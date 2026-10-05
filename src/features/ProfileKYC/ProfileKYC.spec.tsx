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
function setup() {
  vi.stubEnv('NEXT_PUBLIC_ATLAS_BACKEND_URL', 'http://localhost:8080');
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  render(
    <MantineProvider>
      <IntlProvider locale="ru" messages={messages}>
        <QueryClientProvider client={client}>
          <ProfileKYC />
        </QueryClientProvider>
      </IntlProvider>
    </MantineProvider>,
  );
  return client;
}
it('collects data once in a modal, keeps edits after failure, and closes after success', async () => {
  let fail = true;
  const fetcher = vi.fn(async (_url: string, init?: RequestInit) =>
    init?.method === 'PUT'
      ? fail
        ? new Response('', { status: 503 })
        : Response.json({ level: 'KYC_LEVEL_UNVERIFIED' })
      : Response.json({ level: 'KYC_LEVEL_UNVERIFIED' }),
  );
  vi.stubGlobal('fetch', fetcher);
  const client = setup();
  fireEvent.click(await screen.findByRole('button', { name: messages['kyc.start'] }));
  const email = await screen.findByLabelText(messages['kyc.email'], { exact: false });
  expect(email).toHaveValue('');
  expect(screen.getByRole('dialog')).toBeVisible();
  fireEvent.change(email, { target: { value: 'edited@example.com' } });
  const country = screen.getByRole('combobox', { name: new RegExp(messages['kyc.country']) });
  expect(country).toHaveValue('');
  fireEvent.change(country, { target: { value: 'RU' } });
  expect(screen.getByRole('option', { name: 'Россия' })).toBeInTheDocument();
  fireEvent.submit(email.closest('form')!);
  expect(await screen.findByRole('alert')).toHaveTextContent(messages['kyc.saveError']);
  expect(email).toHaveValue('edited@example.com');
  expect(screen.queryByText(messages['kyc.collected'])).not.toBeInTheDocument();
  fail = false;
  fireEvent.submit(email.closest('form')!);
  expect(await screen.findByRole('status')).toHaveTextContent(messages['kyc.collected']);
  expect(screen.getByText(messages['kyc.unverified'])).toBeVisible();
  const call = fetcher.mock.calls.find(([, init]) => init?.method === 'PUT');
  expect(JSON.parse(call![1]!.body as string)).toMatchObject({
    data: { email: 'edited@example.com', passport: { issuingCountry: 'RU' } },
  });
  expect(JSON.parse(call![1]!.body as string)).not.toHaveProperty('level');
  expect(screen.queryByRole('button', { name: messages['kyc.start'] })).not.toBeInTheDocument();
  expect(client.getQueryData(['kyc'])).toEqual({ level: 'KYC_LEVEL_UNVERIFIED' });
  expect(localStorage.length).toBe(0);
  expect(sessionStorage.length).toBe(0);
  client.clear();
});
it('shows a read error instead of an empty editable profile and retries explicitly', async () => {
  const fetcher = vi
    .fn()
    .mockResolvedValueOnce(new Response('', { status: 503 }))
    .mockResolvedValue(Response.json({ level: 'KYC_LEVEL_UNVERIFIED' }));
  vi.stubGlobal('fetch', fetcher);
  const client = setup();
  expect(await screen.findByRole('alert')).toHaveTextContent(messages['kyc.loadError']);
  expect(screen.queryByRole('button', { name: messages['kyc.start'] })).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: messages['kyc.retry'] }));
  await waitFor(() => expect(screen.getByRole('button', { name: messages['kyc.start'] })).toBeVisible());
  client.clear();
});

it('shows verified level without collection actions or personal fields', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json({ level: 'KYC_LEVEL_VERIFIED' })));
  const client = setup();
  expect(await screen.findByText(messages['kyc.verified'])).toBeVisible();
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  expect(screen.queryByRole('button', { name: messages['kyc.start'] })).not.toBeInTheDocument();
  expect(screen.queryByRole('status')).not.toBeInTheDocument();
  expect(client.getQueryData(['kyc'])).toEqual({ level: 'KYC_LEVEL_VERIFIED' });
  client.clear();
});
