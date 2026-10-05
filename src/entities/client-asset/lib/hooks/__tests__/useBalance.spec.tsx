import { createElement, type PropsWithChildren } from 'react';
import { QueryClient, QueryClientProvider, focusManager } from '@tanstack/react-query';
import { renderHook, waitFor, cleanup, act } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useBalance } from '../useBalance';

function wrapper({ children }: PropsWithChildren) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return createElement(QueryClientProvider, { client }, children);
}
afterEach(() => {
  cleanup();
  vi.useRealTimers();
  focusManager.setFocused(undefined);
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});
beforeEach(() => {
  vi.stubEnv('NEXT_PUBLIC_ATLAS_BACKEND_URL', 'http://localhost:8080');
});
describe('useBalance', () => {
  it.each(['0', '9007199254740993'])('preserves exact amount %s and uses session cookies', async (amount) => {
    const fetcher = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          balances: [
            {
              assetId: 'wallet',
              available: { amount, currency: 'USD' },
              reserved: { amount: '0', currency: 'USD' },
            },
          ],
        }),
      ),
    );
    vi.stubGlobal('fetch', fetcher);
    const { result } = renderHook(useBalance, { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual({ availableAmount: amount, reservedAmount: '0' });
    expect(fetcher).toHaveBeenCalledWith(
      'http://localhost:8080/v1/balances',
      expect.objectContaining({ credentials: 'include', cache: 'no-store' }),
    );
  });
  it.each([401, 403, 404, 503])('does not fabricate a balance for HTTP %s', async (status) => {
    const fetcher = vi.fn().mockResolvedValue(new Response('unavailable', { status }));
    vi.stubGlobal('fetch', fetcher);
    const { result } = renderHook(useBalance, { wrapper });
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.data).toBeUndefined();
    expect(fetcher).toHaveBeenCalledTimes(1);
  });
  it('rejects floating-point transport amounts', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            balances: [
              {
                available: { amount: 12.5, currency: 'USD' },
                reserved: { amount: '0', currency: 'USD' },
              },
            ],
          }),
        ),
      ),
    );
    const { result } = renderHook(useBalance, { wrapper });
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.data).toBeUndefined();
  });
});

it('refreshes exact balances every 15 seconds, pauses when hidden, and stops on unmount', async () => {
  vi.useFakeTimers();
  focusManager.setFocused(true);
  let amount = '100';
  const fetcher = vi.fn().mockImplementation(
    async () =>
      new Response(
        JSON.stringify({
          balances: [{ available: { currency: 'USD', amount }, reserved: { currency: 'USD', amount: '0' } }],
        }),
      ),
  );
  vi.stubGlobal('fetch', fetcher);
  const { result, unmount } = renderHook(() => useBalance(15000), { wrapper });
  await act(async () => {
    await vi.advanceTimersByTimeAsync(1);
  });
  expect(result.current.data?.availableAmount).toBe('100');
  amount = '9007199254740993';
  await act(async () => {
    await vi.advanceTimersByTimeAsync(15000);
  });
  expect(fetcher).toHaveBeenCalledTimes(2);
  expect(result.current.data?.availableAmount).toBe(amount);
  expect(result.current.isPending).toBe(false);

  act(() => focusManager.setFocused(false));
  await act(async () => {
    await vi.advanceTimersByTimeAsync(30000);
  });
  expect(fetcher).toHaveBeenCalledTimes(2);
  amount = '200';
  await act(async () => {
    focusManager.setFocused(true);
    await vi.advanceTimersByTimeAsync(1);
  });
  expect(fetcher).toHaveBeenCalledTimes(3);
  expect(result.current.data?.availableAmount).toBe('200');

  unmount();
  await act(async () => {
    await vi.advanceTimersByTimeAsync(30000);
  });
  expect(fetcher).toHaveBeenCalledTimes(3);
});
