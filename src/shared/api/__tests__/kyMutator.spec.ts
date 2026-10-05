// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest';
const { request } = vi.hoisted(() => ({ request: vi.fn() }));
vi.mock('../request', () => ({ request }));
import { kyMutator } from '../kyMutator';
beforeEach(() => {
  request.mockReset();
});
describe('kyMutator', () => {
  it('passes cancellation and JSON request data and decodes a response', async () => {
    request.mockResolvedValue(new Response('{"ok":true}'));
    const signal = new AbortController().signal;
    await expect(kyMutator('/client', { method: 'POST', data: { test: true }, signal })).resolves.toEqual({
      ok: true,
    });
    expect(request).toHaveBeenCalledWith(
      '/client',
      expect.objectContaining({ signal, json: { test: true } }),
    );
  });
  it('accepts no-content success without parsing JSON', async () => {
    request.mockResolvedValue(new Response(null, { status: 204 }));
    await expect(kyMutator('/action', {})).resolves.toBeUndefined();
  });
  it('propagates failure without a fixture fallback', async () => {
    const failure = new Error('network');
    request.mockRejectedValue(failure);
    const result = await kyMutator('/client', {}).catch((error: unknown) => error);
    expect(result).toBe(failure);
  });
});
