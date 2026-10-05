import { afterEach, expect, it, vi } from 'vitest';
import {
  completeTelegramConnection,
  getNotificationSettings,
  NotificationRequestError,
  setNotificationsEnabled,
  startTelegramConnection,
} from './api';
afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});
it('uses backend cookies and persists an explicit false preference', async () => {
  vi.stubEnv('NEXT_PUBLIC_ATLAS_BACKEND_URL', 'http://localhost:8080');
  const fetcher = vi.fn().mockResolvedValue(Response.json({ enabled: false }));
  vi.stubGlobal('fetch', fetcher);
  await setNotificationsEnabled(false);
  expect(fetcher).toHaveBeenCalledWith(
    'http://localhost:8080/v1/notifications/settings',
    expect.objectContaining({ method: 'PUT', credentials: 'include', body: '{"enabled":false}' }),
  );
});
it('rejects hostile redirects and preserves authentication rejection', async () => {
  vi.stubEnv('NEXT_PUBLIC_ATLAS_BACKEND_URL', 'http://localhost:8080');
  vi.stubGlobal(
    'fetch',
    vi
      .fn()
      .mockResolvedValueOnce(Response.json({ redirectUrl: 'https://evil.test/auth' }))
      .mockResolvedValueOnce(new Response('', { status: 401 })),
  );
  await expect(startTelegramConnection()).rejects.toBeInstanceOf(NotificationRequestError);
  await expect(getNotificationSettings()).rejects.toMatchObject({ status: 401 });
});
it('rejects repeated callback parameters before making a request', async () => {
  const fetcher = vi.fn();
  vi.stubGlobal('fetch', fetcher);
  await expect(
    completeTelegramConnection(new URLSearchParams('state=a&state=b&code=c')),
  ).rejects.toMatchObject({ status: 400 });
  expect(fetcher).not.toHaveBeenCalled();
});
