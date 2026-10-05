import { type CardOperation } from '../operationsApi';
import { Decimal, isDecimalAmount } from '~/shared/lib/decimal';
export function formatCardOperationMoney(money?: CardOperation['amount'] | null) {
  if (!money || !isDecimalAmount(money.amount) || !money.currency) return undefined;
  const [whole, fraction = ''] = new Decimal(money.amount).toFixed().split('.');
  return `${whole.replace(/\B(?=(\d{3})+(?!\d))/g, '\u00a0')}${fraction ? `,${fraction}` : ',00'} ${money.currency}`;
}
