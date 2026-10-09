import { afterEach, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MantineProvider } from '@mantine/core';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { IntlProvider } from 'react-intl';
import messages from '../../../dictionaries/ru.json';
import { ProfileEmail } from './ProfileEmail';
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});
function setup() {
  vi.stubEnv('NEXT_PUBLIC_ATLAS_BACKEND_URL', 'http://localhost:8080');
  vi.stubEnv('NEXT_PUBLIC_ATLAS_AUTH_TENANT', 'atlas');
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  render(
    <MantineProvider>
      <IntlProvider locale="ru" messages={messages}>
        <QueryClientProvider client={client}>
          <ProfileEmail />
        </QueryClientProvider>
      </IntlProvider>
    </MantineProvider>,
  );
  return client;
}
it('displays an existing verified address without starting a challenge', async () => {
  const fetcher = vi.fn(async () => Response.json({ email: 'existing@example.com', verified: true }));
  vi.stubGlobal('fetch', fetcher);
  setup();
  expect(await screen.findByText('existing@example.com')).toBeVisible();
  expect(screen.getByText(messages['profile.email.verified'])).toBeVisible();
  expect(screen.queryByRole('button', { name: messages['profile.email.add'] })).not.toBeInTheDocument();
  expect(fetcher).toHaveBeenCalledTimes(1);
});
it('keeps failed identity reads separate from email absence', async () => {
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => new Response('', { status: 503 })),
  );
  setup();
  expect(await screen.findByRole('alert')).toBeVisible();
  expect(screen.queryByRole('button', { name: messages['profile.email.add'] })).not.toBeInTheDocument();
});
it('verifies in a modal, preserves a wrong-code attempt, and confirms only committed email', async () => {
  let linked = false;
  let reject = true;
  const fetcher = vi.fn(async (url: string, init?: RequestInit) => {
    if (url.endsWith('/auth/profile/email'))
      return Response.json({ email: linked ? 'person@example.com' : '', verified: linked });
    if (url.endsWith('/transactions'))
      return Response.json({
        transaction: {
          id: 'link',
          status: 'active',
          availableMethods: [{ methodId: 'email_code', requirementId: 'primary' }],
        },
      });
    if (url.endsWith(':startMethod'))
      return Response.json({
        transaction: { pendingAttempt: { attemptId: 'attempt', challengeId: 'challenge' } },
        challenge: { expiresAt: new Date(Date.now() + 300000).toISOString() },
      });
    expect(JSON.parse(init!.body as string)).toMatchObject({
      attemptId: 'attempt',
      challengeId: 'challenge',
      input: { code: '123456' },
    });
    if (reject) return new Response('', { status: 401 });
    linked = true;
    return Response.json({
      transaction: { status: 'completed' },
      result: { principal: { userId: 'original' } },
    });
  });
  vi.stubGlobal('fetch', fetcher);
  setup();
  fireEvent.click(await screen.findByRole('button', { name: messages['profile.email.add'] }));
  const email = await screen.findByRole('textbox', { name: messages['auth.email'] });
  fireEvent.change(email, { target: { value: 'person@example.com' } });
  fireEvent.submit(email.closest('form')!);
  const code = await screen.findByRole('textbox', { name: messages['auth.code'] });
  fireEvent.change(code, { target: { value: '123456' } });
  fireEvent.submit(code.closest('form')!);
  expect(await screen.findByRole('alert')).toBeVisible();
  expect(code).toHaveValue('123456');
  expect(screen.getByRole('dialog')).toBeVisible();
  expect(screen.getByRole('button', { name: messages['profile.email.resend'] })).toBeDisabled();
  reject = false;
  fireEvent.submit(code.closest('form')!);
  await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  expect(screen.getByText('person@example.com')).toBeVisible();
  const bodies = fetcher.mock.calls
    .filter(([url]) => url.endsWith('/transactions'))
    .map(([, init]) => JSON.parse(init!.body as string));
  expect(bodies).toEqual([{ intent: 'INTENT_UPDATE' }]);
});
