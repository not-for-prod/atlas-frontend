import { describe, expect, it } from 'vitest';
import { formatUsd } from '../formatUsd';
describe('formatUsd', () => {
  it('preserves exact amount beyond JavaScript safe integers', () => {
    expect(formatUsd('9007199254740993.01')).toBe('9 007 199 254 740 993,01 $');
  });
  it('formats zero, negative and single amount without rounding', () => {
    expect(formatUsd('0')).toBe('0,00 $');
    expect(formatUsd('-0.01')).toBe('−0,01 $');
    expect(formatUsd('1.05')).toBe('1,05 $');
  });
  it('rejects decimal or invalid atomic amounts', () => {
    expect(() => formatUsd('1e3')).toThrow();
    expect(() => formatUsd('NaN')).toThrow();
  });
});
