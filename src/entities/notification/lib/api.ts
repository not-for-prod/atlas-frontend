import { backendOrigin } from '~/shared/api/backendOrigin';
import { type NotificationSettings } from '../model';
import { type AtlasNotificationV1StartTelegramConnectionResponse } from '~/generated/atlas/model';
export class NotificationRequestError extends Error {
  constructor(public status: number) {
    super('Notification request unavailable');
  }
}
async function request<T>(path: string, method = 'GET', body?: unknown, signal?: AbortSignal): Promise<T> {
  const response = await fetch(`${backendOrigin()}/v1/notifications/${path}`, {
    method,
    credentials: 'include',
    cache: 'no-store',
    redirect: 'error',
    headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
    signal: AbortSignal.any([AbortSignal.timeout(35000), ...(signal ? [signal] : [])]),
  });
  if (!response.ok) throw new NotificationRequestError(response.status);
  return response.json() as Promise<T>;
}
export async function getNotificationSettings(signal?: AbortSignal) {
  const data = await request<NotificationSettings>('settings', 'GET', undefined, signal);
  if (
    !data ||
    typeof data !== 'object' ||
    Array.isArray(data) ||
    [data.enabled, data.telegramConnected, data.connectionAvailable].some(
      (value) => value !== undefined && typeof value !== 'boolean',
    )
  )
    throw new NotificationRequestError(503);
  return data;
}
export async function setNotificationsEnabled(enabled: boolean) {
  await request('settings', 'PUT', { enabled });
}
export async function startTelegramConnection() {
  const data = await request<AtlasNotificationV1StartTelegramConnectionResponse>(
    'telegram:start',
    'POST',
    {},
  );
  const target = new URL(data.redirectUrl || '');
  if (
    target.origin !== 'https://oauth.telegram.org' ||
    target.pathname !== '/auth' ||
    target.username ||
    target.password
  )
    throw new NotificationRequestError(503);
  return target.href;
}
export async function completeTelegramConnection(params: URLSearchParams) {
  if (['state', 'code', 'error'].some((key) => params.getAll(key).length > 1))
    throw new NotificationRequestError(400);
  await request('telegram:complete', 'POST', {
    state: params.get('state') || '',
    code: params.get('code') || '',
    error: params.get('error') || '',
  });
}
