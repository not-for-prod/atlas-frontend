import { afterEach, describe, expect, it, vi } from 'vitest';
import { getSupport } from './api';
vi.mock('~/shared/api/backendOrigin', () => ({ backendOrigin: () => 'https://atlas.test' }));
afterEach(() => vi.unstubAllGlobals());

describe('Telegram support contact', () => {
  it('loads the configured public contact from the backend', async () => {
    const fetcher = vi.fn().mockResolvedValue(Response.json({ telegramUrl: 'https://t.me/atlas_support' }));
    vi.stubGlobal('fetch', fetcher);
    expect(await getSupport()).toBe('https://t.me/atlas_support');
    expect(fetcher).toHaveBeenCalledWith(
      'https://atlas.test/v1/support',
      expect.objectContaining({ credentials: 'omit' }),
    );
  });
  it.each([{}, { telegramUrl: '' }])('allows support to be unconfigured: %j', async (data) => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json(data)));
    expect(await getSupport()).toBeUndefined();
  });
  it.each([
    null,
    [],
    { telegramUrl: 'javascript:alert(1)' },
    { telegramUrl: 'https://example.com/contact' },
    { telegramUrl: 123 },
  ])('rejects an invalid contact: %j', async (data) => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json(data)));
    await expect(getSupport()).rejects.toThrow();
  });
  it('does not substitute a contact on server failure', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('', { status: 503 })));
    await expect(getSupport()).rejects.toThrow('Support unavailable');
  });
});
