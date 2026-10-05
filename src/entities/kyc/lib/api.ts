import { backendOrigin } from '~/shared/api/backendOrigin';
import {
  type AtlasKycV1GetKYCLevelResponse,
  type AtlasKycV1SaveKYCResponse,
  type AtlasKycV1KYCData,
} from '~/generated/atlas/model';
export type KYCData = AtlasKycV1KYCData;
export class KYCRequestError extends Error {
  constructor(public status: number) {
    super('KYC request unavailable');
  }
}
async function request(path: string, init: RequestInit, signal?: AbortSignal) {
  const response = await fetch(`${backendOrigin()}${path}`, {
    ...init,
    credentials: 'include',
    cache: 'no-store',
    redirect: 'error',
    signal: AbortSignal.any([AbortSignal.timeout(15000), ...(signal ? [signal] : [])]),
  });
  if (!response.ok) throw new KYCRequestError(response.status);
  return response.json();
}
export async function getKYC(
  signal?: AbortSignal,
): Promise<{ level: 'KYC_LEVEL_UNVERIFIED' | 'KYC_LEVEL_VERIFIED' }> {
  const response: AtlasKycV1GetKYCLevelResponse = await request('/v1/kyc/level', {}, signal);
  if (response?.level !== 'KYC_LEVEL_UNVERIFIED' && response?.level !== 'KYC_LEVEL_VERIFIED')
    throw new KYCRequestError(503);
  return { level: response.level };
}
export async function saveKYC(data: KYCData): Promise<AtlasKycV1SaveKYCResponse> {
  const response: AtlasKycV1SaveKYCResponse = await request('/v1/kyc', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ data }),
  });
  if (response?.level !== 'KYC_LEVEL_UNVERIFIED') throw new KYCRequestError(503);
  return response;
}
