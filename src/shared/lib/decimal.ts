import BaseDecimal from 'decimal.js';
// API values are limited to 256 characters. This precision preserves their sums exactly.
export const Decimal = BaseDecimal.clone({ precision: 1024, toExpNeg: -1024, toExpPos: 1024 });
export const decimalAmountPattern = /^(0|[1-9][0-9]*)(\.[0-9]+)?$/;
export function isDecimalAmount(value: unknown): value is string {
  return typeof value === 'string' && value.length <= 256 && decimalAmountPattern.test(value);
}
