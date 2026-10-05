import { type CardOperation } from '../operationsApi';
import { cardOperationTime } from './cardOperationTime';
export function groupCardOperationsByDate(operations: CardOperation[], timeZone = 'Europe/Moscow') {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const groups = new Map<string, { day: string; date?: Date; operations: CardOperation[] }>();
  for (const operation of operations) {
    const date = cardOperationTime(operation.transactionTime);
    const day = date ? formatter.format(date) : 'unknown';
    const group = groups.get(day) ?? { day, date, operations: [] };
    group.operations.push(operation);
    groups.set(day, group);
  }
  return [...groups.values()];
}
