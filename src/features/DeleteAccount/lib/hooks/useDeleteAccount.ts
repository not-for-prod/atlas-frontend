import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { authApi } from '~/entities/auth';
export function useDeleteAccount() {
  const router = useRouter();
  const client = useQueryClient();
  return useMutation({
    mutationFn: authApi.restart,
    retry: false,
    onSuccess: () => {
      client.removeQueries({ queryKey: ['auth', 'deletion'] });
      router.push('/account?intent=delete');
    },
  });
}
