import { useInfiniteQuery } from '@tanstack/react-query';
import { listCards } from '../cardsApi';
export function useCards() {
  return useInfiniteQuery({
    queryKey: ['card', 'list'],
    initialPageParam: '',
    queryFn: ({ pageParam, signal }) => listCards(pageParam, signal),
    getNextPageParam: (page) => page.nextPageToken || undefined,
    retry: false,
    gcTime: 0,
    refetchOnMount: 'always',
    refetchInterval: 15000,
    refetchIntervalInBackground: false,
  });
}
