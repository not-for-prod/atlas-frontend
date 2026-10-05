import { isDecimalAmount } from '~/shared/lib/decimal';
import { useQuery } from '@tanstack/react-query';
import { backendOrigin } from '~/shared/api/backendOrigin';
import { type AtlasPaymentV1ListBalancesResponse } from '~/generated/atlas/model';

export class BalanceRequestError extends Error {
  constructor(public status: number) {
    super('Balance unavailable');
  }
}

export function useBalance(refetchInterval: number | false = false) {
  return useQuery({
    queryKey: ['client-asset', 'balance'],
    queryFn: async ({ signal }) => {
      const response = await fetch(`${backendOrigin()}/v1/balances`, {
        credentials: 'include',
        cache: 'no-store',
        redirect: 'error',
        signal: AbortSignal.any([signal, AbortSignal.timeout(15000)]),
      });
      if (!response.ok) throw new BalanceRequestError(response.status);
      const data: AtlasPaymentV1ListBalancesResponse = await response.json();
      const balance = data.balances?.find((item) => item.available?.currency === 'USD');
      if (
        !balance ||
        balance.reserved?.currency !== 'USD' ||
        !isDecimalAmount(balance.available?.amount) ||
        !isDecimalAmount(balance.reserved.amount)
      ) {
        throw new BalanceRequestError(503);
      }
      return { availableAmount: balance.available.amount, reservedAmount: balance.reserved.amount };
    },
    retry: false,
    gcTime: 0,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
    refetchInterval,
    refetchIntervalInBackground: false,
  });
}
