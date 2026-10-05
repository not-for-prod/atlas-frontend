import { useInfiniteQuery } from '@tanstack/react-query';
import { listCardOperations } from '../operationsApi';
export function useCardOperations(id?: string, enabled = true) {
  return useInfiniteQuery({
    queryKey: ['card', 'operations', id],
    enabled: enabled && !!id,
    initialPageParam: '',
    queryFn: ({ pageParam, signal }) => listCardOperations(id!, pageParam, signal),
    getNextPageParam: (page) => page.nextPageToken || undefined,
    retry: false,
    gcTime: 0,
    refetchOnMount: 'always',
    refetchInterval: 15000,
    refetchIntervalInBackground: false,
  });
}
