import { useQuery } from '@tanstack/react-query';
import { getSupport } from '../api';

export function useSupport() {
  return useQuery({
    queryKey: ['support'],
    queryFn: async ({ signal }) => (await getSupport(signal)) ?? null,
    retry: false,
    staleTime: 0,
    gcTime: 0,
    refetchOnWindowFocus: false,
  });
}
