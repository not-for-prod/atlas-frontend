import { beforeEach, afterEach, expect, it, vi } from 'vitest';
const origin = 'http://localhost:8080';
beforeEach(() => {
  vi.resetModules();
  sessionStorage.clear();
  vi.stubEnv('NEXT_PUBLIC_ATLAS_BACKEND_URL', origin);
  vi.stubEnv('NEXT_PUBLIC_ATLAS_AUTH_TENANT', 'atlas');
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});
it('bootstraps one backend caller before parallel policy and session requests', async () => {
  const fetcher = vi.fn(async (url: string) => {
    if (url.endsWith('/auth/caller')) return new Response(null, { status: 204 });
    if (url.endsWith('/client')) return new Response('authentication required', { status: 401 });
    return Response.json({ intents: [] });
  });
  vi.stubGlobal('fetch', fetcher);
  const { authApi } = await import('../api');
  const [, session] = await Promise.all([authApi.policy(), authApi.session()]);
  expect(session.authenticated).toBe(false);
  expect(fetcher.mock.calls.map(([url]) => url)).toEqual([
    origin + '/auth/caller',
    origin + '/v1/tenants/atlas/auth/policy',
    origin + '/client',
  ]);
  expect(fetcher).toHaveBeenCalledWith(
    origin + '/client',
    expect.objectContaining({
      credentials: 'include',
      headers: expect.objectContaining({ 'X-Atlas-Session': 'cookie' }),
    }),
  );
});
it('exposes Retry-After without retrying a rate-limited command', async () => {
  const fetcher = vi
    .fn()
    .mockResolvedValue(new Response('rate limited', { status: 429, headers: { 'Retry-After': '60' } }));
  vi.stubGlobal('fetch', fetcher);
  const { request } = await import('../transport');
  await expect(request('/auth/logout', {})).rejects.toMatchObject({ code: 'rate_limited', retryAfter: 60 });
  expect(fetcher).toHaveBeenCalledTimes(1);
});
it('distinguishes pending client initialization from an ordinary outage', async () => {
  const fetcher = vi
    .fn()
    .mockResolvedValueOnce(new Response('client initialization pending', { status: 503 }))
    .mockResolvedValueOnce(new Response('database unavailable', { status: 503 }));
  vi.stubGlobal('fetch', fetcher);
  const { request } = await import('../transport');
  await expect(request('/client')).rejects.toMatchObject({ code: 'initializing' });
  await expect(request('/client')).rejects.toMatchObject({ code: 'unavailable' });
});
it('rejects a missing backend rather than silently calling the frontend', async () => {
  vi.stubEnv('NEXT_PUBLIC_ATLAS_BACKEND_URL', '');
  const fetcher = vi.fn();
  vi.stubGlobal('fetch', fetcher);
  const { request } = await import('../transport');
  await expect(request('/client')).rejects.toMatchObject({ code: 'not_configured' });
  expect(fetcher).not.toHaveBeenCalled();
});
it('clears corrupt or expired transaction progress', async () => {
  const { writeAuth, readAuth } = await import('../storage');
  writeAuth('flow', { transactionId: 'expired', expiresAt: new Date(0).toISOString() });
  expect(readAuth('flow')).toBeUndefined();
  expect(sessionStorage.length).toBe(0);
});
it('rejects callbacks without an existing flow or with duplicate state before sending proof', async () => {
  const fetcher = vi.fn();
  vi.stubGlobal('fetch', fetcher);
  const { authApi } = await import('../api');
  await expect(authApi.callback('google', new URLSearchParams('state=a&code=b'))).rejects.toMatchObject({
    code: 'expired',
  });
  await expect(authApi.callback('google', new URLSearchParams('state=a&state=b'))).rejects.toMatchObject({
    code: 'invalid',
  });
  expect(fetcher).not.toHaveBeenCalled();
});
it('does not bootstrap or store a token while completing OAuth', async () => {
  const { writeAuth } = await import('../storage');
  writeAuth('flow', {
    transactionId: 'tx',
    expiresAt: new Date(Date.now() + 60000).toISOString(),
    tariff: 'travel',
  });
  const fetcher = vi.fn().mockResolvedValue(Response.json({ authenticated: true }));
  vi.stubGlobal('fetch', fetcher);
  const { authApi } = await import('../api');
  await expect(authApi.callback('google', new URLSearchParams('state=a&code=b'))).resolves.toBe(
    '/account?tariff=travel',
  );
  expect(fetcher).toHaveBeenCalledTimes(1);
  expect(fetcher).toHaveBeenCalledWith(
    origin + '/auth/callback/google?state=a&code=b',
    expect.objectContaining({
      credentials: 'include',
      headers: expect.objectContaining({ 'X-Atlas-Session': 'cookie' }),
    }),
  );
  expect(sessionStorage.length).toBe(0);
});

it('does not call a transaction-creation 404 an expired login', async () => {
  const fetcher = vi
    .fn()
    .mockImplementation(async () => Response.json({ code: 5, message: 'NotFound' }, { status: 404 }));
  vi.stubGlobal('fetch', fetcher);
  const { request } = await import('../transport');
  await expect(
    request('/v1/tenants/atlas/auth/transactions', { intent: 'INTENT_SIGN_IN' }),
  ).rejects.toMatchObject({ code: 'unavailable', status: 404 });
  await expect(request('/v1/tenants/atlas/auth/transactions/expired-id')).rejects.toMatchObject({
    code: 'expired',
    status: 404,
  });
});

it('returns an actionable callback error and clears the failed flow without registering', async () => {
  const { writeAuth, readAuth } = await import('../storage');
  writeAuth('flow', {
    transactionId: 'tx',
    expiresAt: new Date(Date.now() + 60000).toISOString(),
    tariff: 'travel',
  });
  const fetcher = vi.fn().mockResolvedValue(Response.json({ error: 'account_not_found' }, { status: 404 }));
  vi.stubGlobal('fetch', fetcher);
  const { authApi } = await import('../api');
  await expect(authApi.callback('google', new URLSearchParams('state=a&code=b'))).resolves.toBe(
    '/account?tariff=travel&authError=account_not_found',
  );
  expect(readAuth('flow')).toBeUndefined();
  expect(fetcher).toHaveBeenCalledTimes(1);
});
it('does not mistake generic callback errors for an unknown account', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json({ message: 'NotFound' }, { status: 404 })));
  const { request } = await import('../transport');
  await expect(request('/auth/callback/google?state=a&code=b')).rejects.toMatchObject({
    code: 'unavailable',
  });
});

it('completes deletion without a session and clears saved progress', async () => {
  const { writeAuth, readAuth } = await import('../storage');
  writeAuth('flow', {
    transactionId: 'delete-tx',
    expiresAt: new Date(Date.now() + 60000).toISOString(),
    intent: 'INTENT_DELETE',
  });
  const fetcher = vi.fn(async (url: string) => {
    if (url.endsWith('/auth/caller')) return new Response(null, { status: 204 });
    if (url.endsWith(':verifyMethod'))
      return Response.json({
        result: { principal: { userId: 'old-user' } },
        transaction: { id: 'delete-tx', intent: 'INTENT_DELETE', status: 'completed' },
      });
    return Response.json({
      transaction: {
        id: 'delete-tx',
        intent: 'INTENT_DELETE',
        status: 'active',
        pendingAttempt: {
          ready: true,
          attemptId: 'attempt',
          challengeId: 'challenge',
          selection: { methodId: 'email_code' },
        },
      },
    });
  });
  vi.stubGlobal('fetch', fetcher);
  const { authApi } = await import('../api');
  await expect(authApi.verify('123456')).resolves.toEqual({ authenticated: false, deleted: true });
  expect(readAuth('flow')).toBeUndefined();
});
it('recovers confirmed deletion before inspecting the old browser session', async () => {
  const { writeAuth } = await import('../storage');
  writeAuth('flow', {
    transactionId: 'delete-tx',
    expiresAt: new Date(Date.now() + 60000).toISOString(),
    intent: 'INTENT_DELETE',
  });
  const fetcher = vi.fn(async (url: string) => {
    if (url.endsWith('/auth/caller') || url.endsWith('/auth/logout'))
      return new Response(null, { status: 204 });
    return Response.json({ transaction: { id: 'delete-tx', intent: 'INTENT_DELETE', status: 'completed' } });
  });
  vi.stubGlobal('fetch', fetcher);
  const { authApi } = await import('../api');
  await expect(authApi.deletionSession()).resolves.toEqual({ authenticated: false, deleted: true });
  expect(fetcher.mock.calls.some(([url]) => url.endsWith('/client'))).toBe(false);
});
it('retains the attempt for an explicit frozen-deletion retry', async () => {
  const { writeAuth } = await import('../storage');
  writeAuth('flow', {
    transactionId: 'delete-tx',
    expiresAt: new Date(Date.now() + 60000).toISOString(),
    intent: 'INTENT_DELETE',
    attemptId: 'attempt',
    challengeId: 'challenge',
  });
  const fetcher = vi.fn(async (url: string) => {
    if (url.endsWith('/auth/caller')) return new Response(null, { status: 204 });
    if (url.endsWith(':verifyMethod'))
      return Response.json({ result: {}, transaction: { intent: 'INTENT_DELETE', status: 'completed' } });
    return Response.json({ transaction: { id: 'delete-tx', intent: 'INTENT_DELETE', status: 'finalizing' } });
  });
  vi.stubGlobal('fetch', fetcher);
  const { authApi } = await import('../api');
  await expect(authApi.verify('000000')).resolves.toMatchObject({ deleted: true });
  expect(fetcher).toHaveBeenCalledWith(
    expect.stringContaining(':verifyMethod'),
    expect.objectContaining({
      body: JSON.stringify({ attemptId: 'attempt', challengeId: 'challenge', input: { code: '000000' } }),
    }),
  );
});
it('returns to sign-in after OAuth deletion without treating it as login', async () => {
  const { writeAuth, readAuth } = await import('../storage');
  writeAuth('flow', {
    transactionId: 'delete-tx',
    expiresAt: new Date(Date.now() + 60000).toISOString(),
    intent: 'INTENT_DELETE',
  });
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue(Response.json({ status: 'completed', intent: 'delete', deleted: true })),
  );
  const { authApi } = await import('../api');
  await expect(authApi.callback('google', new URLSearchParams('state=state&code=code'))).resolves.toBe(
    '/account?deleted=1',
  );
  expect(readAuth('flow')).toBeUndefined();
});

it('retries a frozen OAuth deletion with its original callback association', async () => {
  const { writeAuth, readAuth } = await import('../storage');
  writeAuth('flow', {
    transactionId: 'delete-tx',
    expiresAt: new Date(Date.now() + 60000).toISOString(),
    intent: 'INTENT_DELETE',
    callbackProvider: 'google',
    callbackState: 'original-state',
  });
  const fetcher = vi.fn(async (url: string) =>
    url.includes('/auth/callback/')
      ? Response.json({ deleted: true })
      : Response.json({ transaction: { status: 'finalizing', intent: 'INTENT_DELETE' } }),
  );
  vi.stubGlobal('fetch', fetcher);
  const { authApi } = await import('../api');
  await expect(authApi.retryDeletion()).resolves.toEqual({ authenticated: false, deleted: true });
  expect(fetcher).toHaveBeenCalledWith(
    expect.stringContaining('/auth/callback/google?state=original-state'),
    expect.anything(),
  );
  expect(readAuth('flow')).toBeUndefined();
});

it('distinguishes an unregistered verified account from an expired transaction', async () => {
  const { request } = await import('../transport');
  const path = '/v1/tenants/atlas/auth/transactions/tx:verifyMethod';
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue(Response.json({ code: 5, message: 'account_not_found' }, { status: 404 })),
  );
  await expect(request(path, { input: { code: '123456' } })).rejects.toMatchObject({
    code: 'account_not_found',
    status: 404,
  });
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue(Response.json({ code: 5, message: 'NotFound' }, { status: 404 })),
  );
  await expect(request(path, { input: { code: '123456' } })).rejects.toMatchObject({
    code: 'expired',
    status: 404,
  });
});
