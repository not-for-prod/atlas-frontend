import { describe, expect, it } from 'vitest';
import { formatUsdt } from '../formatUsdt';
describe('formatUsdt', () => {
  it.each([
    ['0.000001', '0,000001 USDT'],
    ['1', '1 USDT'],
    ['9007199254.740993', '9\u00a0007\u00a0199\u00a0254,740993 USDT'],
  ])('preserves exact micro-USDT %s', (amount, expected) => expect(formatUsdt(amount)).toBe(expected));
  it('rejects decimal transport units', () => expect(() => formatUsdt('NaN')).toThrow());
});
