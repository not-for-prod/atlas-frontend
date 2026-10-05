import { Decimal } from '~/shared/lib/decimal';
// Display every supplied decimal digit; pad amount without rounding exact sub-cent values.
export function formatUsd(amount: string): string {
  if (amount.length > 257 || !/^-?(0|[1-9][0-9]*)(\.[0-9]+)?$/.test(amount))
    throw new Error('Invalid USD amount');
  const value = new Decimal(amount);
  const [whole, fraction = ''] = value.abs().toFixed().split('.');
  const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, '\u00a0');
  return `${value.isNegative() && !value.isZero() ? '−' : ''}${grouped},${fraction.padEnd(2, '0')} $`;
}
