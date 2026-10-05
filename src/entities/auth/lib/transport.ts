import { backendOrigin } from '~/shared/api/backendOrigin';
export class AuthRequestError extends Error {
  constructor(
    public code: string,
    public retryAfter = 0,
    public status = 503,
  ) {
    super(code);
  }
}
export function authPath(suffix: string) {
  const tenant = process.env.NEXT_PUBLIC_ATLAS_AUTH_TENANT;
  if (!tenant) throw new AuthRequestError('not_configured');
  return `/v1/tenants/${encodeURIComponent(tenant)}/auth/${suffix}`;
}
export async function request<T>(path: string, body?: unknown): Promise<T> {
  let origin: string;
  try {
    origin = backendOrigin();
  } catch {
    throw new AuthRequestError('not_configured');
  }
  let response: Response;
  try {
    response = await fetch(origin + path, {
      method: body === undefined ? 'GET' : 'POST',
      credentials: 'include',
      cache: 'no-store',
      redirect: 'error',
      signal: AbortSignal.timeout(35000),
      headers: {
        'X-Atlas-Session': 'cookie',
        ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new AuthRequestError('unavailable');
  }
  if (!response.ok) {
    const text = await response.text();
    if (response.status === 404 && path.startsWith('/auth/callback/')) {
      let payload: unknown;
      try {
        payload = JSON.parse(text);
      } catch {
        /* Non-JSON errors keep the status fallback. */
      }
      if (
        payload &&
        typeof payload === 'object' &&
        'error' in payload &&
        payload.error === 'account_not_found'
      )
        throw new AuthRequestError('account_not_found', 0, response.status);
    }
    const code =
      response.status === 503 && text.trim() === 'client initialization pending'
        ? 'initializing'
        : (
            {
              400: 'invalid',
              401: 'invalid',
              403: 'forbidden',
              404: path.startsWith(authPath('transactions/')) ? 'expired' : 'unavailable',
              409: 'conflict',
              429: 'rate_limited',
            } as Record<number, string>
          )[response.status] || 'unavailable';
    throw new AuthRequestError(code, Number(response.headers.get('Retry-After')) || 0, response.status);
  }
  if (response.status === 204) return undefined as T;
  try {
    return (await response.json()) as T;
  } catch {
    throw new AuthRequestError('unavailable');
  }
}
