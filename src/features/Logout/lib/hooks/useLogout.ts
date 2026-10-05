import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useBalanceVisibility } from '~/shared/ui/BalanceVisibilityProvider';
import { authApi } from '~/entities/auth';
export function useLogout() {
  const client = useQueryClient();
  const { hide } = useBalanceVisibility();
  const router = useRouter();
  return useMutation({
    mutationFn: authApi.logout,
    retry: false,
    onSuccess: async (session) => {
      hide();
      await client.cancelQueries({ queryKey: ['auth'] });
      client.setQueryData(['auth', 'cabinet'], session);
      client.setQueryData(['auth', 'session'], session);
      client.removeQueries({ queryKey: ['auth', 'deletion'] });
      const filters = {
        predicate: (query: { queryKey: readonly unknown[] }) =>
          ['client-asset', 'payment', 'kyc', 'card', 'notification'].includes(String(query.queryKey[0])),
      };
      await client.cancelQueries(filters);
      client.removeQueries(filters);
      router.replace('/account');
    },
  });
}
