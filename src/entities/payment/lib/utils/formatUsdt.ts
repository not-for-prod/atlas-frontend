import { Decimal, isDecimalAmount } from '~/shared/lib/decimal';
export function formatUsdt(amount: string) {
  if (!isDecimalAmount(amount)) throw new Error('Invalid USDT amount');
  const [whole, fraction] = new Decimal(amount).toFixed().split('.');
  const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, '\u00a0');
  return `${grouped}${fraction ? `,${fraction}` : ''} USDT`;
}
