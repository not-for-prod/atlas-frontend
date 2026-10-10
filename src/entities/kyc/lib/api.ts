import { backendOrigin } from '~/shared/api/backendOrigin';
import { AtlasKycV1KYCCheck, AtlasKycV1VerificationStatus } from '~/generated/atlas/model';
import { type KYCState, type KYCContacts } from '../model';
export class KYCRequestError extends Error {
  constructor(public status: number) {
    super('KYC request unavailable');
  }
}
async function request(path: string, init: RequestInit, signal?: AbortSignal): Promise<KYCState> {
  const response = await fetch(`${backendOrigin()}${path}`, {
    ...init,
    credentials: 'include',
    cache: 'no-store',
    redirect: 'error',
    signal: AbortSignal.any([AbortSignal.timeout(20000), ...(signal ? [signal] : [])]),
  });
  if (!response.ok) throw new KYCRequestError(response.status);
  const body = await response.json();
  const state = body?.state;
  if (
    !state ||
    typeof state !== 'object' ||
    Array.isArray(state) ||
    !Object.values(AtlasKycV1VerificationStatus).includes(state.status) ||
    state.status === 'VERIFICATION_STATUS_UNSPECIFIED' ||
    ['eligible', 'contactsComplete'].some(
      (key) => state[key] !== undefined && typeof state[key] !== 'boolean',
    ) ||
    ['verificationUrl', 'reason'].some((key) => state[key] !== undefined && typeof state[key] !== 'string') ||
    ['passedChecks', 'requiredChecks', 'missingChecks'].some(
      (key) =>
        state[key] !== undefined &&
        (!Array.isArray(state[key]) ||
          state[key].some(
            (check: unknown) =>
              !Object.values(AtlasKycV1KYCCheck).includes(check as AtlasKycV1KYCCheck) ||
              check === 'KYC_CHECK_UNSPECIFIED',
          )),
    )
  )
    throw new KYCRequestError(503);
  if (state.verificationUrl) {
    let url: URL;
    try {
      url = new URL(state.verificationUrl);
    } catch {
      throw new KYCRequestError(503);
    }
    if (url.protocol !== 'https:' || url.username || url.password) throw new KYCRequestError(503);
  }
  // Only the agreed status projection enters the private cache, never extra personal fields.
  return {
    status: state.status,
    passedChecks: state.passedChecks ?? [],
    requiredChecks: state.requiredChecks ?? [],
    missingChecks: state.missingChecks ?? [],
    contactsComplete: state.contactsComplete ?? false,
    eligible: state.eligible ?? false,
    verificationUrl: state.verificationUrl ?? '',
    reason: state.reason ?? '',
  };
}
export function getKYC(cardTypeId?: string, signal?: AbortSignal) {
  const query = cardTypeId ? `?${new URLSearchParams({ cardTypeId })}` : '';
  return request(`/v1/kyc${query}`, {}, signal);
}
export function saveKYCContacts(contacts: KYCContacts, signal?: AbortSignal) {
  return request(
    '/v1/kyc/contacts',
    {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: contacts.email }),
    },
    signal,
  );
}
export function startKYCVerification(cardTypeId: string, signal?: AbortSignal) {
  return request(
    '/v1/kyc/verification',
    { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ cardTypeId }) },
    signal,
  );
}
