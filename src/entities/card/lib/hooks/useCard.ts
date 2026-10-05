import { useQuery } from '@tanstack/react-query';
import { getCard } from '../cardsApi';
export function useCard(id?: string) {
  return useQuery({
    queryKey: ['card', 'detail', id],
    enabled: !!id,
    queryFn: ({ signal }) => getCard(id!, signal),
    retry: false,
    gcTime: 0,
    refetchOnMount: 'always',
    refetchInterval: 15000,
    refetchIntervalInBackground: false,
  });
}
