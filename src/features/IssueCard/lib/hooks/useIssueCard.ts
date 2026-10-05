import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  useCurrentIssue,
  getIssue,
  issueCard,
  isIssueTerminal,
  type IssueCardRequest,
} from '~/entities/card';
export function useIssueCard() {
  const client = useQueryClient();
  const pending = useRef<IssueCardRequest | null>(null);
  const [issueId, setIssueId] = useState<string>();
  const retainedId = useSearchParams().get('issue');
  const current = useCurrentIssue();
  const id = issueId || retainedId || current.data?.id;
  const progress = useQuery({
    queryKey: ['card', 'issue', id],
    queryFn: ({ signal }) => getIssue(id!, signal),
    enabled: !!id,
    retry: false,
    gcTime: 0,
    refetchInterval: (query) => (query.state.data && isIssueTerminal(query.state.data) ? false : 3000),
    refetchIntervalInBackground: false,
  });
  const mutation = useMutation({
    mutationFn: issueCard,
    retry: false,
    onError: () => {
      void current.refetch();
    },
    onSuccess: (issue) => {
      setIssueId(issue.id);
      client.setQueryData(['card', 'issue', issue.id], issue);
      client.setQueryData(['card', 'issue', 'current'], issue);
      void client.invalidateQueries({ queryKey: ['client-asset'] });
    },
  });
  const issue = progress.data || mutation.data || current.data;
  useEffect(() => {
    if (!issue?.id) return;
    const url = new URL(window.location.href);
    if (url.searchParams.get('issue') === issue.id) return;
    url.searchParams.set('issue', issue.id);
    window.history.replaceState(window.history.state, '', url);
  }, [issue?.id]);
  useEffect(() => {
    if (!issue || !isIssueTerminal(issue)) return;
    void client.invalidateQueries({ queryKey: ['card', 'list'] });
    void client.invalidateQueries({ queryKey: ['client-asset'] });
  }, [client, issue]);
  function submit(cardTypeId: string, name: string, expectedPrice: string, expectedCommission: string) {
    if (mutation.isPending || id) return;
    pending.current ??= {
      expectedPrice,
      expectedCommission,
      idempotencyKey: crypto.randomUUID(),
      cardTypeId,
      name: name.trim(),
    };
    mutation.mutate(pending.current);
  }
  return {
    current,
    progress,
    mutation,
    issue,
    submit,
    locked: !!mutation.variables,
    loading: !issue && (current.isPending || (!!id && progress.isPending)),
    unavailable: !issue && (current.isError || (!!id && progress.isError)),
    refresh: id ? progress.refetch : current.refetch,
  };
}
