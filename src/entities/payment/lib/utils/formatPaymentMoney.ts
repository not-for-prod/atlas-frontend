import { type AtlasCommonV1Money as Money } from '~/generated/atlas/model';
import { Decimal, isDecimalAmount } from '~/shared/lib/decimal';
import { formatUsdt } from './formatUsdt';
export function formatPaymentMoney(money?: Money | null): string | undefined {
  if (!money || !isDecimalAmount(money.amount)) return undefined;
  if (money.currency === 'USDT') return formatUsdt(money.amount);
  if (money.currency !== 'USD' && money.currency !== 'RUB') return undefined;
  const [whole, fraction = ''] = new Decimal(money.amount).toFixed().split('.');
  const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, '\u00a0');
  return `${grouped},${fraction.padEnd(2, '0')} ${money.currency}`;
}
