import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { parseCardCategory } from '~/entities/card';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  authApi,
  AuthRequestError,
  policyChoices,
  supportedChoice,
  type AuthIntent,
  type AuthProgress,
  type MethodSelection,
} from '~/entities/auth';
export function useAuthentication(tariff?: string, deleting = false) {
  const client = useQueryClient();
  const router = useRouter();
  const [intent, setIntent] = useState<AuthIntent>();
  const policy = useQuery({ queryKey: ['auth', 'policy'], queryFn: authApi.policy, staleTime: 0 });
  const session = useQuery({
    queryKey: ['auth', deleting ? 'deletion' : 'session'],
    queryFn: deleting ? authApi.deletionSession : authApi.session,
    refetchInterval: (query) => (query.state.data?.initializing ? 2000 : false),
  });
  const intents =
    policy.data?.intents?.filter((item) =>
      deleting
        ? item.intent === 'INTENT_DELETE'
        : item.intent === 'INTENT_SIGN_IN' || item.intent === 'INTENT_SIGN_UP',
    ) || [];
  const progress = session.data;
  const activeIntent = ((deleting ? 'INTENT_DELETE' : undefined) ||
    progress?.transaction?.intent ||
    intent ||
    intents.find((item) => item.intent === 'INTENT_SIGN_IN')?.intent ||
    intents[0]?.intent) as AuthIntent | undefined;
  const choices = progress?.transaction
    ? progress.transaction.availableMethods || []
    : policyChoices(intents.find((item) => item.intent === activeIntent)?.requirements);
  const mutation = useMutation({
    mutationFn: async (
      action:
        | { kind: 'start'; selection: MethodSelection; email?: string }
        | { kind: 'verify'; code: string }
        | { kind: 'restart' }
        | { kind: 'retryDeletion' }
        | { kind: 'logout' }
        | { kind: 'intent'; intent: AuthIntent },
    ) => {
      if (action.kind === 'start') {
        if (!activeIntent) throw new AuthRequestError('method_unavailable');
        return authApi.start({
          intent: activeIntent,
          selection: action.selection,
          email: action.email,
          tariff,
        });
      }
      if (action.kind === 'retryDeletion') return authApi.retryDeletion();
      if (action.kind === 'verify') return authApi.verify(action.code);
      if (action.kind === 'logout') return authApi.logout();
      const result = await authApi.restart();
      if (action.kind === 'intent') setIntent(action.intent);
      return result;
    },
    onSuccess: (result: AuthProgress) => {
      client.setQueryData(['auth', deleting ? 'deletion' : 'session'], result);
      if (result.redirectUrl) window.location.assign(result.redirectUrl);
      if (result.authenticated) void client.invalidateQueries({ queryKey: ['auth', 'session'] });
    },
    onError: () => {
      // Reads recover transaction progress after a lost response; commands are never auto-retried.
      void client.invalidateQueries({ queryKey: ['auth', deleting ? 'deletion' : 'session'] });
    },
    retry: false,
  });
  useEffect(() => {
    if (progress?.deleted) {
      void client.cancelQueries().then(() => {
        client.clear();
        window.location.replace('/account?deleted=1');
      });
      return;
    }
    if (
      !deleting &&
      progress?.authenticated &&
      !progress.initializing &&
      !session.isFetching &&
      !session.error &&
      !mutation.isPending
    ) {
      const selected = parseCardCategory(tariff || progress.tariff);
      router.replace(`/cabinet${selected ? `?tariff=${encodeURIComponent(selected)}` : ''}`);
    }
  }, [progress, session.isFetching, session.error, mutation.isPending, tariff, router, deleting, client]);
  const error = mutation.error || session.error || policy.error;
  return {
    policy,
    session,
    progress,
    intents,
    activeIntent,
    choices: choices.filter(supportedChoice),
    unsupported: choices.some((choice) => !supportedChoice(choice)),
    loading: policy.isPending || session.isPending,
    pending: mutation.isPending,
    error: error instanceof AuthRequestError ? error.code : error ? 'unavailable' : undefined,
    retryAfter: error instanceof AuthRequestError ? error.retryAfter : 0,
    act: mutation.mutate,
    retry: () => {
      mutation.reset();
      void policy.refetch();
      void session.refetch();
    },
  };
}
