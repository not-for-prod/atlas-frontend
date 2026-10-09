import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getSbpPayment } from '../sbpApi';
export function useSbpPayment(id?: string) {
  const client = useQueryClient();
  const query = useQuery({
    queryKey: ['payment', 'sbp', id],
    queryFn: ({ signal }) => getSbpPayment(id!, signal),
    enabled: !!id,
    retry: false,
    gcTime: 0,
    refetchInterval: (current) =>
      ['completed', 'failed'].includes(current.state.data?.status ?? '') ? false : 5000,
    refetchIntervalInBackground: false,
  });
  useEffect(() => {
    if (query.data?.status !== 'completed') return;
    void client.invalidateQueries({ queryKey: ['client-asset'] });
    void client.invalidateQueries({ queryKey: ['payment', 'history'] });
  }, [client, query.data?.status]);
  return query;
}
