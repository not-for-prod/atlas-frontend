import { afterEach, describe, expect, it, vi } from 'vitest';
import { getCardTariff } from './api';
import { parseCardCategory } from './utils/parseCardCategory';
vi.mock('~/shared/api/backendOrigin', () => ({ backendOrigin: () => 'https://atlas.test' }));
afterEach(() => vi.unstubAllGlobals());
const fixture = {
  tariffId: 'cards',
  currency: 'USD',
  categories: {
    CATEGORY_NEW: {
      description: '<b>Plain text</b>',
      fees: { issue: { fixed: '9007199254740993' }, deposit: { percent: '1.123456789012345678' } },
    },
  },
};
describe('card tariff boundary', () => {
  it('uses the card service and preserves exact amounts and unknown categories', async () => {
    const fetcher = vi.fn().mockResolvedValue(Response.json(fixture));
    vi.stubGlobal('fetch', fetcher);
    const tariff = await getCardTariff();
    expect(fetcher).toHaveBeenCalledWith(
      'https://atlas.test/v1/cards/tariff',
      expect.objectContaining({ credentials: 'omit', cache: 'no-store' }),
    );
    expect(tariff.categories[0]).toEqual({ id: 'CATEGORY_NEW', ...fixture.categories.CATEGORY_NEW });
  });
  it('accepts an empty available catalog', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json({ tariffId: 'cards', currency: 'USD' })));
    expect((await getCardTariff()).categories).toEqual([]);
  });
  it.each([503, 404])('does not fabricate prices on HTTP %s', async (status) => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('', { status })));
    await expect(getCardTariff()).rejects.toMatchObject({ status });
  });
  it.each([
    { fixed: 2000 },
    { fixed: '-1' },
    { fixed: 'Infinity' },
    {},
    { percent: '1.1234567890123456789' },
  ])('rejects malformed fee %j', async (fee) => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValue(
          Response.json({ ...fixture, categories: { CATEGORY_NEW: { fees: { issue: fee } } } }),
        ),
    );
    await expect(getCardTariff()).rejects.toMatchObject({ status: 503 });
  });
  it('preserves exact card type IDs without rewriting aliases', () => {
    expect(parseCardCategory('CATEGORY_NEW')).toBe('CATEGORY_NEW');
    expect(parseCardCategory('travel')).toBe('travel');
    expect(parseCardCategory('Custom.Card/ABC')).toBe('Custom.Card/ABC');
    expect(parseCardCategory(['travel', 'premium'])).toBeUndefined();
    expect(parseCardCategory('x'.repeat(257))).toBeUndefined();
  });
});

describe('card top-up limits', () => {
  it.each([undefined, null, {}, { minimalAmount: '0', maximumAmount: '9007199254740993' }])(
    'accepts optional limits %j without precision loss',
    async (topup) => {
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue(
          Response.json({
            ...fixture,
            categories: { CATEGORY_NEW: { ...fixture.categories.CATEGORY_NEW, topup } },
          }),
        ),
      );
      expect((await getCardTariff()).categories[0].topup).toEqual(topup ?? undefined);
    },
  );
  it.each([
    { minimalAmount: '-1' },
    { maximumAmount: 'Infinity' },
    { minimalAmount: 100 },
    { minimalAmount: '2', maximumAmount: '1' },
    { maximumAmount: '1e3' },
  ])('rejects invalid limits %j', async (topup) => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        Response.json({
          ...fixture,
          categories: { CATEGORY_NEW: { ...fixture.categories.CATEGORY_NEW, topup } },
        }),
      ),
    );
    await expect(getCardTariff()).rejects.toMatchObject({ status: 503 });
  });
});

describe('configured card type presentation', () => {
  it('preserves names, palettes and mixed-case IDs', async () => {
    const type = {
      ...fixture.categories.CATEGORY_NEW,
      name: 'Custom card',
      palette: { background: '#123456', foreground: '#ABCDEF' },
    };
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(Response.json({ ...fixture, categories: { 'Custom.Card/ABC': type } })),
    );
    expect((await getCardTariff()).categories).toEqual([{ id: 'Custom.Card/ABC', ...type }]);
  });
  it.each([
    { name: 42 },
    { name: 'a'.repeat(257) },
    { palette: {} },
    { palette: { background: 'url(https://example.com)', foreground: '#ffffff' } },
    { palette: { background: '#123456', foreground: '#fff' } },
  ])('rejects malformed presentation %j', async (presentation) => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        Response.json({
          ...fixture,
          categories: { custom: { ...fixture.categories.CATEGORY_NEW, ...presentation } },
        }),
      ),
    );
    await expect(getCardTariff()).rejects.toMatchObject({ status: 503 });
  });
});
