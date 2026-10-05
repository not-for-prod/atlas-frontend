'use client';

import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getTopUp, isTopUpTerminal } from '../topUpApi';
export function useTopUp(id?: string, cardId?: string) {
  const client = useQueryClient();
  const query = useQuery({
    queryKey: ['card', 'topup', id],
    queryFn: ({ signal }) => getTopUp(id!, cardId!, signal),
    enabled: !!id && !!cardId,
    retry: false,
    gcTime: 0,
    refetchInterval: (current) => (current.state.data && isTopUpTerminal(current.state.data) ? false : 3000),
    refetchIntervalInBackground: false,
  });
  useEffect(() => {
    if (!query.data || !isTopUpTerminal(query.data)) return;
    void client.invalidateQueries({ queryKey: ['card', 'detail', cardId] });
    void client.invalidateQueries({ queryKey: ['card', 'list'] });
    void client.invalidateQueries({ queryKey: ['client-asset'] });
    void client.invalidateQueries({ queryKey: ['payment'] });
  }, [client, query.data, cardId]);
  return query;
}
