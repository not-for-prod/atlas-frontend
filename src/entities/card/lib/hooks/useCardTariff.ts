import { useQuery } from '@tanstack/react-query';
import { getCardTariff } from '../api';
export function useCardTariff() {
  return useQuery({
    queryKey: ['card', 'tariff'],
    queryFn: ({ signal }) => getCardTariff(signal),
    retry: false,
    gcTime: 0,
    staleTime: 0,
    refetchOnMount: 'always',
    refetchOnWindowFocus: false,
  });
}
