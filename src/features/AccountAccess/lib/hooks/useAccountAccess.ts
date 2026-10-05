import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { authApi } from '~/entities/auth';
import { BalanceRequestError } from '~/entities/client-asset';
import { KYCRequestError } from '~/entities/kyc';
import { CardRequestError } from '~/entities/card';
import { NotificationRequestError } from '~/entities/notification';
import { PaymentRequestError } from '~/entities/payment';

export function useAccountAccess() {
  const client = useQueryClient();
  const router = useRouter();
  const session = useQuery({
    queryKey: ['auth', 'cabinet'],
    queryFn: authApi.session,
    gcTime: 0,
    staleTime: 0,
    retry: false,
    refetchOnWindowFocus: true,
    refetchInterval: (query) => (query.state.data?.authenticated ? 15000 : false),
  });
  useEffect(() => {
    const rejectSession = (error: unknown) => {
      if (
        (error instanceof NotificationRequestError ||
          error instanceof BalanceRequestError ||
          error instanceof PaymentRequestError ||
          error instanceof KYCRequestError ||
          error instanceof CardRequestError) &&
        [401, 403].includes(error.status)
      ) {
        void client.cancelQueries({ queryKey: ['auth', 'cabinet'] });
        client.setQueryData(['auth', 'cabinet'], { authenticated: false });
        client.setQueryData(['auth', 'session'], { authenticated: false });
      }
    };
    const unsubscribeQueries = client.getQueryCache().subscribe((event) => {
      if (event.type === 'updated' && event.action.type === 'error') rejectSession(event.action.error);
    });
    const unsubscribeMutations = client.getMutationCache().subscribe((event) => {
      if (event.type === 'updated' && event.action.type === 'error') rejectSession(event.action.error);
    });
    return () => {
      unsubscribeQueries();
      unsubscribeMutations();
    };
  }, [client]);
  useEffect(() => {
    if (session.isPending || (session.data?.authenticated && !session.isError)) return;
    const filters = {
      predicate: (query: { queryKey: readonly unknown[] }) =>
        query.queryKey[0] === 'notification' ||
        query.queryKey[0] === 'payment' ||
        query.queryKey[0] === 'client-asset' ||
        query.queryKey[0] === 'kyc' ||
        query.queryKey[0] === 'card',
    };
    void client.cancelQueries(filters);
    client.removeQueries(filters);
    if (!session.isError && !session.data?.authenticated) router.replace('/account');
  }, [client, router, session.isPending, session.isError, session.data?.authenticated]);
  return session;
}
