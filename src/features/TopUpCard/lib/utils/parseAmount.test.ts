import { describe, expect, it } from 'vitest';
import { parseAmount } from './parseAmount';
describe('top-up decimal amount input', () => {
  it('preserves exact values and accepts a decimal comma', () => {
    expect(parseAmount('90071992547409.93')).toBe('90071992547409.93');
    expect(parseAmount('12,5')).toBe('12.5');
    expect(parseAmount('1.03626944')).toBe('1.03626944');
    expect(parseAmount('92233720368547758.08')).toBe('92233720368547758.08');
    expect(parseAmount('0001.00')).toBe('1');
  });
  it('rejects malformed values, zero, negatives and exponent notation', () => {
    for (const input of ['0', '-1', '1e3', '', 'NaN', '1'.repeat(257)])
      expect(parseAmount(input)).toBeUndefined();
  });
});
