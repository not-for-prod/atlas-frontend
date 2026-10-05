import { type AtlasPaymentV1Payment as Payment } from '~/generated/atlas/model';

export function groupPaymentsByDate(payments: Payment[], timeZone?: string) {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    timeZone,
  });
  const groups = new Map<string, { day: string; date: string; payments: Payment[] }>();
  for (const payment of payments) {
    const date = payment.createdAt!;
    const key = formatter.format(new Date(date));
    const group = groups.get(key);
    if (group) group.payments.push(payment);
    else groups.set(key, { day: key, date, payments: [payment] });
  }
  return [...groups.values()];
}
