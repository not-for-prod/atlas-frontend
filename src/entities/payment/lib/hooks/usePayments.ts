import { useInfiniteQuery } from '@tanstack/react-query';
import { listPayments } from '../api';
export function usePayments({ enabled = true }: { enabled?: boolean } = {}) {
  return useInfiniteQuery({
    enabled,
    queryKey: ['payment', 'history'],
    initialPageParam: '',
    queryFn: ({ pageParam, signal }) => listPayments(pageParam, signal),
    getNextPageParam: (page) => page.nextPageToken || undefined,
    retry: false,
    gcTime: 0,
    refetchOnMount: 'always',
    refetchInterval: 15000,
    refetchIntervalInBackground: false,
  });
}
