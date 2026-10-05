'use client';

import { useEffect, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getCurrentIssue, isIssueTerminal } from '../issuanceApi';
export function useCurrentIssue() {
  const client = useQueryClient();
  const activeId = useRef<string | undefined>(undefined);
  const query = useQuery({
    queryKey: ['card', 'issue', 'current'],
    queryFn: ({ signal }) => getCurrentIssue(signal),
    retry: false,
    gcTime: 0,
    staleTime: 0,
    refetchInterval: (current) => (current.state.data && !isIssueTerminal(current.state.data) ? 3000 : 15000),
    refetchIntervalInBackground: false,
  });
  useEffect(() => {
    if (!query.isSuccess) return;
    const issue = query.data;
    if (issue && !isIssueTerminal(issue)) {
      activeId.current = issue.id;
      return;
    }
    if (!activeId.current) return;
    activeId.current = undefined;
    void client.invalidateQueries({ queryKey: ['card', 'list'] });
    void client.invalidateQueries({ queryKey: ['client-asset'] });
    void client.invalidateQueries({ queryKey: ['payment'] });
  }, [client, query.data, query.isSuccess]);
  return query;
}
