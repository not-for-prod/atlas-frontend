import { backendOrigin } from '~/shared/api/backendOrigin';
import { type AtlasSupportV1GetSupportResponse } from '~/generated/atlas/model';

export async function getSupport(signal?: AbortSignal) {
  const response = await fetch(`${backendOrigin()}/v1/support`, {
    credentials: 'omit',
    cache: 'no-store',
    redirect: 'error',
    signal: AbortSignal.any([AbortSignal.timeout(15000), ...(signal ? [signal] : [])]),
  });
  if (!response.ok) throw new Error('Support unavailable');
  const data: AtlasSupportV1GetSupportResponse = await response.json();
  if (!data || typeof data !== 'object' || Array.isArray(data)) throw new Error('Invalid support response');
  const url = data.telegramUrl;
  if (url === undefined || url === '') return undefined;
  if (typeof url !== 'string' || !/^https:\/\/t\.me\/[a-zA-Z0-9_]{5,32}$/.test(url))
    throw new Error('Invalid Telegram support link');
  return url;
}
