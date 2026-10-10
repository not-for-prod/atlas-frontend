import { afterEach, expect, it, vi } from 'vitest';
import { getKYC, saveKYCContacts, startKYCVerification, KYCRequestError } from './api';
vi.mock('~/shared/api/backendOrigin', () => ({ backendOrigin: () => 'https://atlas.test' }));
afterEach(() => vi.unstubAllGlobals());
/** @tags kyc api @description Private status reads never expose passport fields or infer approval. */
it('reads card-specific status with cookies and strips extra personal fields', async () => {
  const fetcher = vi.fn().mockResolvedValue(
    Response.json({
      state: {
        status: 'VERIFICATION_STATUS_APPROVED',
        contactsComplete: true,
        eligible: false,
        passedChecks: ['KYC_CHECK_IDENTITY_DOCUMENT'],
        requiredChecks: ['KYC_CHECK_LIVENESS'],
        missingChecks: ['KYC_CHECK_LIVENESS'],
        passport: { number: 'synthetic-secret' },
      },
    }),
  );
  vi.stubGlobal('fetch', fetcher);
  const state = await getKYC('Custom.Card/ABC');
  expect(state.eligible).toBe(false);
  expect(state).not.toHaveProperty('passport');
  expect(fetcher).toHaveBeenCalledWith(
    'https://atlas.test/v1/kyc?cardTypeId=Custom.Card%2FABC',
    expect.objectContaining({ credentials: 'include', cache: 'no-store', redirect: 'error' }),
  );
});
it('accepts omitted protobuf defaults without granting eligibility', async () => {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue(Response.json({ state: { status: 'VERIFICATION_STATUS_NOT_STARTED' } })),
  );
  expect(await getKYC()).toMatchObject({
    eligible: false,
    contactsComplete: false,
    missingChecks: [],
    verificationUrl: '',
  });
});
it.each([
  {},
  { status: 'VERIFICATION_STATUS_UNSPECIFIED' },
  { status: 'future' },
  { status: 'VERIFICATION_STATUS_APPROVED', eligible: 'true' },
  { status: 'VERIFICATION_STATUS_APPROVED', missingChecks: ['unknown'] },
  { status: 'VERIFICATION_STATUS_AWAITING_USER', verificationUrl: 'javascript:alert(1)' },
  {
    status: 'VERIFICATION_STATUS_AWAITING_USER',
    verificationUrl: 'https://user:secret@verify.didit.me/path',
  },
])('rejects malformed states or unsafe links: %j', async (state) => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json({ state })));
  await expect(getKYC()).rejects.toBeInstanceOf(KYCRequestError);
});
it('saves only contacts and starts only the selected card verification', async () => {
  const fetcher = vi
    .fn()
    .mockImplementation(() =>
      Promise.resolve(Response.json({ state: { status: 'VERIFICATION_STATUS_NOT_STARTED' } })),
    );
  vi.stubGlobal('fetch', fetcher);
  await saveKYCContacts({ email: 'test@example.com' });
  await startKYCVerification('travel');
  expect(fetcher.mock.calls.map(([url, init]) => [url, init.method, JSON.parse(init.body)])).toEqual([
    ['https://atlas.test/v1/kyc/contacts', 'PUT', { email: 'test@example.com' }],
    ['https://atlas.test/v1/kyc/verification', 'POST', { cardTypeId: 'travel' }],
  ]);
});
it.each([401, 403, 503])('preserves HTTP %s for session rejection or explicit retry', async (status) => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('', { status })));
  await expect(getKYC()).rejects.toMatchObject({ status });
});
