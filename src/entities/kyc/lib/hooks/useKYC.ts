import { useQuery } from '@tanstack/react-query';
import { getKYC } from '../api';
import { isKYCActive } from '../utils/isKYCActive';
export function useKYC(cardTypeId?: string, enabled = true) {
  return useQuery({
    queryKey: ['kyc', cardTypeId ?? ''],
    queryFn: ({ signal }) => getKYC(cardTypeId, signal),
    enabled,
    retry: false,
    gcTime: 0,
    staleTime: 0,
    refetchOnWindowFocus: true,
    refetchInterval: (query) => (query.state.error ? false : isKYCActive(query.state.data) ? 3000 : false),
    refetchIntervalInBackground: false,
  });
}
