import { useQuery } from '@tanstack/react-query';
import { getSbpPreview } from '../sbpApi';
export function useSbpPreview(amount: string) {
  return useQuery({
    queryKey: ['payment', 'sbp-preview', amount],
    queryFn: ({ signal }) => getSbpPreview(amount, signal),
    retry: false,
    gcTime: 0,
    staleTime: Infinity,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
}
