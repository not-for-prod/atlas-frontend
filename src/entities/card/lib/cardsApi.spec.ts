import { afterEach, expect, it, vi } from 'vitest';
import { getCard, getCardRequisites, listCards } from './cardsApi';
vi.mock('~/shared/api/backendOrigin', () => ({ backendOrigin: () => 'https://atlas.test' }));
afterEach(() => vi.unstubAllGlobals());
const card = { id: 'card', cardTypeId: 'CATEGORY_TRAVEL', currency: 'USD', status: 'CARD_STATUS_ACTIVE' };
it('lists stored cards with cookies and leaves unavailable balances absent', async () => {
  const fetcher = vi.fn().mockResolvedValue(Response.json({ cards: [card], nextPageToken: 'next' }));
  vi.stubGlobal('fetch', fetcher);
  const page = await listCards('');
  expect(page.cards?.[0].balance).toBeUndefined();
  expect(fetcher).toHaveBeenCalledWith(
    'https://atlas.test/v1/cards?page_size=20&page_token=',
    expect.objectContaining({ credentials: 'include', cache: 'no-store' }),
  );
});
it('accepts an empty list and protobuf null balances', async () => {
  vi.stubGlobal(
    'fetch',
    vi
      .fn()
      .mockResolvedValueOnce(Response.json({ cards: [] }))
      .mockResolvedValueOnce(Response.json({ card: { ...card, balance: null } })),
  );
  expect((await listCards('')).cards).toEqual([]);
  expect((await getCard('card')).balance).toBeNull();
});
it.each([401, 403, 404, 503])('preserves HTTP %s without fallback cards', async (status) => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('', { status })));
  await expect(listCards('')).rejects.toMatchObject({ status });
});
it.each([
  { cards: [{ ...card, status: 'made-up' }] },
  { cards: [{ ...card, balance: { currency: 'USD', amount: 100 } }] },
  { cards: [{ ...card, balance: { currency: 'USD', amount: 'Infinity' } }] },
  { cards: 'invalid' },
  { cards: [], nextPageToken: 'next' },
])('rejects invalid card pages %j', async (data) => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json(data)));
  await expect(listCards('')).rejects.toMatchObject({ status: 503 });
});
it('rejects a mismatched detail identity', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json({ card })));
  await expect(getCard('another')).rejects.toMatchObject({ status: 503 });
});

it('keeps ordinary detail reads free of requisites and preserves them only on explicit reveal', async () => {
  vi.stubGlobal(
    'fetch',
    vi
      .fn()
      .mockImplementation(() =>
        Promise.resolve(
          Response.json({ card, requisites: { number: 'TEST-NUMBER', holderName: 'TEST HOLDER' } }),
        ),
      ),
  );
  expect(await getCard('card')).not.toHaveProperty('requisites');
  expect(await getCardRequisites('card', new AbortController().signal)).toEqual({
    number: 'TEST-NUMBER',
    holderName: 'TEST HOLDER',
  });
});
it('rejects malformed secret fields and mismatched ownership responses', async () => {
  vi.stubGlobal(
    'fetch',
    vi
      .fn()
      .mockResolvedValueOnce(Response.json({ card, requisites: { securityCode: 123 } }))
      .mockResolvedValueOnce(Response.json({ card })),
  );
  await expect(getCardRequisites('card', new AbortController().signal)).rejects.toMatchObject({
    status: 503,
  });
  await expect(getCardRequisites('another', new AbortController().signal)).rejects.toMatchObject({
    status: 503,
  });
});
