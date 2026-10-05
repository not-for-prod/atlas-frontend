import { Decimal, isDecimalAmount } from '~/shared/lib/decimal';
import { backendOrigin } from '~/shared/api/backendOrigin';
import { type AtlasCardV1GetTariffResponse } from '~/generated/atlas/model';
import { type CardCategory } from '../model/tariff';

export class CardTariffError extends Error {
  constructor(public status: number) {
    super('Card tariff unavailable');
  }
}

export async function getCardTariff(signal?: AbortSignal) {
  const response = await fetch(`${backendOrigin()}/v1/cards/tariff`, {
    credentials: 'omit',
    cache: 'no-store',
    redirect: 'error',
    signal: AbortSignal.any([AbortSignal.timeout(15000), ...(signal ? [signal] : [])]),
  });
  if (!response.ok) throw new CardTariffError(response.status);
  const data: AtlasCardV1GetTariffResponse = await response.json();
  if (
    !data ||
    typeof data.tariffId !== 'string' ||
    !data.tariffId ||
    data.currency !== 'USD' ||
    (data.categories !== undefined &&
      (!data.categories || typeof data.categories !== 'object' || Array.isArray(data.categories)))
  )
    throw new CardTariffError(503);
  const categories: CardCategory[] = Object.entries(data.categories || {})
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([id, category]) => {
      if (
        !id.trim() ||
        new TextEncoder().encode(id).length > 256 ||
        !category ||
        typeof category !== 'object' ||
        Array.isArray(category) ||
        (category.name !== undefined &&
          (typeof category.name !== 'string' || [...category.name].length > 256)) ||
        (category.description !== undefined &&
          (typeof category.description !== 'string' || [...category.description].length > 2000)) ||
        !category.fees ||
        typeof category.fees !== 'object' ||
        Array.isArray(category.fees) ||
        !Object.keys(category.fees).length
      )
        throw new CardTariffError(503);
      const palette = category.palette;
      if (
        palette != null &&
        (typeof palette !== 'object' ||
          Array.isArray(palette) ||
          typeof palette.background !== 'string' ||
          !/^#[0-9a-fA-F]{6}$/.test(palette.background) ||
          typeof palette.foreground !== 'string' ||
          !/^#[0-9a-fA-F]{6}$/.test(palette.foreground))
      )
        throw new CardTariffError(503);
      for (const fee of Object.values(category.fees)) {
        if (
          !fee ||
          typeof fee !== 'object' ||
          Array.isArray(fee) ||
          (fee.fixed === undefined && fee.minimal === undefined && fee.percent === undefined)
        )
          throw new CardTariffError(503);
        for (const amount of [fee.fixed, fee.minimal]) {
          if (amount !== undefined && !isDecimalAmount(amount)) throw new CardTariffError(503);
        }
        if (
          fee.percent !== undefined &&
          (typeof fee.percent !== 'string' || !/^\d{1,19}(\.\d{1,18})?$/.test(fee.percent))
        )
          throw new CardTariffError(503);
      }
      const limits = category.topup;
      if (limits != null) {
        if (typeof limits !== 'object' || Array.isArray(limits)) throw new CardTariffError(503);
        for (const amount of [limits.minimalAmount, limits.maximumAmount]) {
          if (amount !== undefined && !isDecimalAmount(amount)) throw new CardTariffError(503);
        }
        if (
          limits.minimalAmount !== undefined &&
          limits.maximumAmount !== undefined &&
          new Decimal(limits.minimalAmount).gt(limits.maximumAmount)
        )
          throw new CardTariffError(503);
      }
      return {
        id,
        ...(category.name ? { name: category.name } : {}),
        ...(palette != null ? { palette } : {}),
        description: category.description || '',
        fees: category.fees,
        ...(limits != null ? { topup: limits } : {}),
      };
    });
  return { id: data.tariffId, currency: data.currency, categories };
}
