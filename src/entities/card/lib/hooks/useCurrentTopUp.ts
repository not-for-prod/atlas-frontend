import { useQuery } from '@tanstack/react-query';
import { getCurrentTopUp } from '../topUpApi';
export function useCurrentTopUp(cardId?: string) {
  return useQuery({
    queryKey: ['card', 'topup', 'current', cardId],
    queryFn: ({ signal }) => getCurrentTopUp(cardId!, signal),
    enabled: !!cardId,
    retry: false,
    gcTime: 0,
    staleTime: 0,
  });
}
