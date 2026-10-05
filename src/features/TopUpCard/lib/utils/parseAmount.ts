import { Decimal } from '~/shared/lib/decimal';
export function parseAmount(input: string): string | undefined {
  if (input.length > 256 || !/^\d+([.,]\d*)?$/.test(input)) return;
  const amount = new Decimal(input.replace(',', '.'));
  if (!amount.isPositive()) return;
  return amount.toFixed();
}
