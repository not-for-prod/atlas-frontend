import { type AtlasPaymentV1SbpPreview as SbpPreview } from '~/generated/atlas/model';
import { Decimal, isDecimalAmount } from '~/shared/lib/decimal';
import { formatPaymentMoney } from './formatPaymentMoney';

export function formatSbpRate(quote: Pick<SbpPreview, 'amount' | 'credit'>): string | undefined {
  if (
    quote.amount?.currency !== 'RUB' ||
    quote.credit?.currency !== 'USD' ||
    !isDecimalAmount(quote.amount.amount) ||
    !isDecimalAmount(quote.credit.amount)
  )
    return undefined;
  const amount = new Decimal(quote.amount.amount);
  const credit = new Decimal(quote.credit.amount);
  if (!amount.gt(0) || !credit.gt(0)) return undefined;
  return formatPaymentMoney({
    amount: amount.div(credit).toFixed(2, Decimal.ROUND_HALF_UP),
    currency: 'RUB',
  });
}
