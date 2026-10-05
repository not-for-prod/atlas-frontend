import { Decimal } from '~/shared/lib/decimal';
import { type IntlShape } from 'react-intl';
import { formatUsd } from '~/entities/client-asset';
import { type CardFee } from '../../model/tariff';
export function formatCardFee(fee: CardFee | undefined, intl: IntlShape): string {
  if (!fee) return intl.formatMessage({ id: 'cardTariff.unconfigured' });
  const parts: string[] = [];
  if (fee.fixed !== undefined && !new Decimal(fee.fixed).eq('0')) parts.push(formatUsd(fee.fixed));
  if (fee.percent !== undefined && !/^0(?:\.0+)?$/.test(fee.percent))
    parts.push(`${fee.percent.replace('.', ',')}%`);
  const base = parts.join(' + ') || formatUsd('0');
  return fee.minimal !== undefined && new Decimal(fee.minimal).gt('0')
    ? intl.formatMessage({ id: 'cardTariff.minimum' }, { base, minimum: formatUsd(fee.minimal) })
    : base;
}
