import { Decimal } from '~/shared/lib/decimal';

export function parseDepositAmount(input: string): string | undefined {
  const value = input.trim();
  if (value.length > 256 || !/^\d+([.,]\d{1,2})?$/.test(value)) return;
  const amount = new Decimal(value.replace(',', '.'));
  if (!amount.greaterThan(0)) return;
  const normalized = amount.toFixed(2);
  return normalized.length <= 256 ? normalized : undefined;
}
