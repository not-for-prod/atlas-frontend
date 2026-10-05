import { useQuery } from '@tanstack/react-query';
import { getIssue, getTopUp, isIssueTerminal, isTopUpTerminal } from '~/entities/card';
import { type Payment } from '~/entities/payment';
export function usePaymentProgress(payment: Payment) {
  const issuance = payment.type === 'PAYMENT_TYPE_CARD_ISSUE';
  const prefix = issuance ? 'card-issue:' : 'card-top-up:';
  const id = payment.id?.startsWith(prefix) ? payment.id.slice(prefix.length) : undefined;
  return useQuery({
    queryKey: ['card', 'payment-progress', issuance ? 'issue' : 'top-up', id],
    queryFn: async ({ signal }) => {
      if (!id) throw new Error('Missing operation identity');
      if (issuance) return { kind: 'issue' as const, order: await getIssue(id, signal) };
      if (!payment.cardId) throw new Error('Missing card identity');
      return { kind: 'top-up' as const, order: await getTopUp(id, payment.cardId, signal) };
    },
    retry: false,
    gcTime: 0,
    refetchInterval: (query) => {
      const data = query.state.data;
      if (data?.order && (data.kind === 'issue' ? isIssueTerminal(data.order) : isTopUpTerminal(data.order)))
        return false;
      return 3000;
    },
    refetchIntervalInBackground: false,
  });
}
