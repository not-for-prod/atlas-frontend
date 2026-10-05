import { useQuery } from '@tanstack/react-query';
import { getKYC } from '../api';
export function useKYC() {
  return useQuery({
    queryKey: ['kyc'],
    queryFn: ({ signal }) => getKYC(signal),
    retry: false,
    gcTime: 0,
    staleTime: 0,
    refetchOnWindowFocus: false,
  });
}
