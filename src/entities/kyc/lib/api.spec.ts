import { afterEach, expect, it, vi } from 'vitest';
import { getKYC, KYCRequestError } from './api';
afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});
it.each(['KYC_LEVEL_UNVERIFIED', 'KYC_LEVEL_VERIFIED'] as const)(
  'reads only %s through the credentialed level endpoint',
  async (level) => {
    vi.stubEnv('NEXT_PUBLIC_ATLAS_BACKEND_URL', 'http://localhost:8080');
    const fetcher = vi.fn().mockResolvedValue(Response.json({ level }));
    vi.stubGlobal('fetch', fetcher);
    expect(await getKYC()).toEqual({ level });
    expect(fetcher).toHaveBeenCalledWith(
      'http://localhost:8080/v1/kyc/level',
      expect.objectContaining({ credentials: 'include', cache: 'no-store' }),
    );
  },
);
it('rejects unknown levels rather than treating them as unverified', async () => {
  vi.stubEnv('NEXT_PUBLIC_ATLAS_BACKEND_URL', 'http://localhost:8080');
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json({ level: 'KYC_LEVEL_UNSPECIFIED' })));
  await expect(getKYC()).rejects.toBeInstanceOf(KYCRequestError);
});
