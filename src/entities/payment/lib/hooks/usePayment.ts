import { useQuery } from '@tanstack/react-query';
import { getPayment } from '../api';
export function usePayment(id: string | null) {
  return useQuery({
    queryKey: ['payment', 'detail', id],
    queryFn: ({ signal }) => getPayment(id!, signal),
    enabled: !!id,
    retry: false,
    gcTime: 0,
    refetchOnMount: 'always',
    refetchInterval: 15000,
    refetchIntervalInBackground: false,
  });
}
