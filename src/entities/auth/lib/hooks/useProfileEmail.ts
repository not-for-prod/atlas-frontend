import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getProfileEmail, startEmailLink, verifyEmailLink } from '../profileEmailApi';
export function useProfileEmail() {
  const client = useQueryClient();
  const query = useQuery({
    queryKey: ['profile-email'],
    queryFn: ({ signal }) => getProfileEmail(signal),
    retry: false,
    gcTime: 0,
    refetchOnMount: 'always',
  });
  const start = useMutation({ mutationFn: startEmailLink, retry: false, gcTime: 0 });
  const verify = useMutation({
    mutationFn: verifyEmailLink,
    retry: false,
    gcTime: 0,
    onSuccess: (data) => {
      client.setQueryData(['profile-email'], data);
    },
  });
  return { query, start, verify };
}
