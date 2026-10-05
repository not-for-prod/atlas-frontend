import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { CardRequestError } from './cardsApi';
import { listCardOperations } from './operationsApi';
import { formatCardOperationMoney } from './utils/formatCardOperationMoney';
import { cardOperationTime } from './utils/cardOperationTime';
beforeEach(() => vi.stubEnv('NEXT_PUBLIC_ATLAS_BACKEND_URL', 'http://localhost:8080'));
afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});
const operation = {
  id: 'row',
  type: 'CARD_OPERATION_TYPE_PURCHASE',
  status: 'CARD_OPERATION_STATUS_AUTHORIZED',
  amount: { amount: '90071992547409.931234', currency: 'EUR' },
};
it('reads only the selected card and preserves exact foreign currency money', async () => {
  const fetcher = vi
    .fn()
    .mockResolvedValue(new Response(JSON.stringify({ operations: [operation], nextPageToken: 'next' })));
  vi.stubGlobal('fetch', fetcher);
  const page = await listCardOperations('card/one', '');
  expect(page.operations?.[0].amount).toEqual(operation.amount);
  expect(formatCardOperationMoney(page.operations?.[0].amount)).toBe(
    '90\u00a0071\u00a0992\u00a0547\u00a0409,931234 EUR',
  );
  expect(fetcher).toHaveBeenCalledWith(
    'http://localhost:8080/v1/cards/card%2Fone/operations?page_size=20&page_token=',
    expect.objectContaining({ credentials: 'include', cache: 'no-store' }),
  );
});
it.each([
  { operations: [{ ...operation, amount: { amount: '1.2e3', currency: 'USD' } }] },
  { operations: [{ ...operation, status: 'invented' }] },
  { operations: [operation], nextPageToken: 'same' },
  { operations: [], nextPageToken: 'next' },
  { operations: {} },
])('rejects malformed or nonadvancing history instead of empty success', async (body) => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify(body))));
  await expect(listCardOperations('card', 'same')).rejects.toBeInstanceOf(CardRequestError);
});
it('preserves response status for the account gate', async () => {
  const fetcher = vi.fn().mockResolvedValue(new Response('unauthorized', { status: 401 }));
  vi.stubGlobal('fetch', fetcher);
  await expect(listCardOperations('card', '')).rejects.toMatchObject({ status: 401 });
  expect(fetcher).toHaveBeenCalledTimes(1);
});
it('does not infer a timezone for provider timestamp text', () => {
  expect(cardOperationTime('2026-10-03T12:00:00')).toBeUndefined();
  expect(cardOperationTime('2026-10-03T12:00:00+03:00')?.toISOString()).toBe('2026-10-03T09:00:00.000Z');
  expect(cardOperationTime('malformed')).toBeUndefined();
});
