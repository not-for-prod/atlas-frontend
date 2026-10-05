import {
  type AuthPolicy,
  type AuthProgress,
  type Transaction,
  type TransactionResponse,
  type CreateResponse,
  type StartResponse,
  type VerifyResponse,
  type StartInput,
} from '../model';
import { supportedChoice, choiceKey } from './utils/policyChoices';
import { request, authPath, AuthRequestError } from './transport';
import { readAuth, writeAuth } from './storage';
export { AuthRequestError } from './transport';
// Share bootstrap across concurrent policy/session queries to avoid caller-cookie races.
let caller: Promise<void> | undefined;
function bootstrap() {
  if (!caller)
    caller = request<void>('/auth/caller').catch((error: unknown) => {
      caller = undefined;
      throw error;
    });
  return caller;
}
function saveFlow(transaction: Transaction, tariff?: string) {
  if (!transaction.id || !transaction.expiresAt) throw new AuthRequestError('unavailable');
  writeAuth('flow', {
    transactionId: transaction.id,
    expiresAt: transaction.expiresAt,
    tariff,
    intent: transaction.intent,
    attemptId: transaction.pendingAttempt?.attemptId,
    challengeId: transaction.pendingAttempt?.challengeId,
  });
}
async function getTransaction(id: string): Promise<Transaction> {
  const result = await request<TransactionResponse>(authPath(`transactions/${encodeURIComponent(id)}`));
  if (!result.transaction) throw new AuthRequestError('unavailable');
  return result.transaction;
}
async function deletionSession(): Promise<AuthProgress> {
  await bootstrap();
  const flow = readAuth('flow');
  if (flow?.intent === 'INTENT_DELETE' && flow.transactionId) {
    const transaction = await getTransaction(flow.transactionId);
    if (transaction.status === 'completed') {
      await request('/auth/logout', {});
      writeAuth('flow');
      return { authenticated: false, deleted: true };
    }
    return { authenticated: false, transaction };
  }
  await request('/client');
  return { authenticated: false };
}
async function session(): Promise<AuthProgress> {
  await bootstrap();
  try {
    await request('/client');
    return { authenticated: true };
  } catch (error) {
    if (error instanceof AuthRequestError && error.code === 'initializing')
      return { authenticated: true, initializing: true };
    if (!(error instanceof AuthRequestError) || ![401, 403].includes(error.status)) throw error;
  }
  const flow = readAuth('flow');
  if (flow?.transactionId) {
    try {
      return {
        authenticated: false,
        transaction: await getTransaction(flow.transactionId),
        tariff: flow.tariff,
      };
    } catch (error) {
      if (!(error instanceof AuthRequestError) || ![400, 401, 403, 404].includes(error.status)) throw error;
      writeAuth('flow');
    }
  }
  return { authenticated: false };
}
async function start(input: StartInput): Promise<AuthProgress> {
  await bootstrap();
  if (
    !['INTENT_SIGN_IN', 'INTENT_SIGN_UP', 'INTENT_DELETE'].includes(input.intent) ||
    !input.selection ||
    !supportedChoice(input.selection)
  )
    throw new AuthRequestError('invalid', 0, 400);
  if (
    input.selection.methodId === 'email_code' &&
    (typeof input.email !== 'string' ||
      input.email.length > 254 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email))
  )
    throw new AuthRequestError('invalid', 0, 400);
  const flow = readAuth('flow');
  let transaction = flow?.transactionId ? await getTransaction(flow.transactionId) : undefined;
  if (!transaction || transaction.intent !== input.intent) {
    transaction = (await request<CreateResponse>(authPath('transactions'), { intent: input.intent }))
      .transaction;
  }
  if (!transaction?.id || transaction.status !== 'active') throw new AuthRequestError('expired', 0, 409);
  const selected = transaction.availableMethods?.find(
    (method) => choiceKey(method) === choiceKey(input.selection),
  );
  if (!selected) throw new AuthRequestError('method_unavailable', 0, 409);
  const tariff = input.tariff || flow?.tariff;
  saveFlow(transaction, tariff);
  const result = await request<StartResponse>(
    authPath(`transactions/${encodeURIComponent(transaction.id)}:startMethod`),
    {
      selection: selected,
      input: selected.methodId === 'email_code' ? { email: input.email?.trim() } : {},
    },
  );
  if (!result.transaction) throw new AuthRequestError('unavailable');
  saveFlow(result.transaction, tariff);
  if (result.redirectUrl) {
    const url = new URL(result.redirectUrl);
    if (url.protocol !== 'https:' || url.username || url.password) throw new AuthRequestError('unavailable');
  }
  return {
    authenticated: false,
    transaction: result.transaction,
    challengeExpiresAt: result.challenge?.expiresAt,
    redirectUrl: result.redirectUrl,
    tariff,
  };
}
async function verify(code: string): Promise<AuthProgress> {
  await bootstrap();
  if (typeof code !== 'string' || !/^\d{6}$/.test(code)) throw new AuthRequestError('invalid', 0, 400);
  const flow = readAuth('flow');
  if (!flow?.transactionId) throw new AuthRequestError('expired', 0, 400);
  const transaction = await getTransaction(flow.transactionId);
  const pending =
    transaction.pendingAttempt ||
    (transaction.intent === 'INTENT_DELETE' &&
    ['finalizing', 'completed'].includes(transaction.status || '') &&
    flow.attemptId
      ? {
          ready: true,
          selection: { methodId: 'email_code' },
          attemptId: flow.attemptId,
          challengeId: flow.challengeId,
        }
      : undefined);
  if (
    !pending?.ready ||
    pending.selection?.methodId !== 'email_code' ||
    !pending.attemptId ||
    !pending.challengeId
  )
    throw new AuthRequestError('expired', 0, 400);
  const result = await request<VerifyResponse>(
    authPath(`transactions/${encodeURIComponent(flow.transactionId)}:verifyMethod`),
    {
      attemptId: pending.attemptId,
      challengeId: pending.challengeId,
      input: { code },
    },
  );
  if (
    result.result &&
    result.transaction?.intent === 'INTENT_DELETE' &&
    result.transaction.status === 'completed'
  ) {
    writeAuth('flow');
    return { authenticated: false, deleted: true };
  }
  if (result.result?.session) {
    writeAuth('flow');
    return { authenticated: true, tariff: flow.tariff };
  }
  if (!result.transaction) throw new AuthRequestError('unavailable');
  saveFlow(result.transaction, flow.tariff);
  return { authenticated: false, transaction: result.transaction, tariff: flow.tariff };
}

export const authApi = {
  policy: async () => {
    await bootstrap();
    return request<AuthPolicy>(authPath('policy'));
  },
  session,
  deletionSession,
  retryDeletion: async (): Promise<AuthProgress> => {
    const flow = readAuth('flow');
    if (flow?.intent !== 'INTENT_DELETE' || !flow.transactionId) throw new AuthRequestError('expired');
    const transaction = await getTransaction(flow.transactionId);
    if (transaction.status === 'completed') return deletionSession();
    if (transaction.status !== 'finalizing') throw new AuthRequestError('conflict');
    if (flow.callbackProvider && flow.callbackState) {
      const query = new URLSearchParams({ state: flow.callbackState });
      const result = await request<{ deleted?: boolean }>(
        `/auth/callback/${encodeURIComponent(flow.callbackProvider)}?${query}`,
      );
      if (!result.deleted) throw new AuthRequestError('unavailable');
      writeAuth('flow');
      return { authenticated: false, deleted: true };
    }
    return verify('000000');
  },
  start,
  verify,
  restart: async (): Promise<AuthProgress> => {
    writeAuth('flow');
    return { authenticated: false };
  },
  logout: async (): Promise<AuthProgress> => {
    await request('/auth/logout', {});
    writeAuth('flow');
    return { authenticated: false };
  },
  callback: async (provider: string, params: URLSearchParams) => {
    if (!['google', 'yandex', 'mailru', 'telegram'].includes(provider)) throw new AuthRequestError('invalid');
    for (const key of ['state', 'code', 'error'])
      if (params.getAll(key).length > 1) throw new AuthRequestError('invalid');
    if (!params.get('state')) throw new AuthRequestError('invalid');
    const flow = readAuth('flow');
    if (!flow?.transactionId) throw new AuthRequestError('expired');
    const query = new URLSearchParams();
    for (const key of ['state', 'code', 'error']) {
      const value = params.get(key);
      if (value) query.set(key, value);
    }
    if (flow.intent === 'INTENT_DELETE')
      writeAuth('flow', { ...flow, callbackProvider: provider, callbackState: params.get('state')! });
    // Do not bootstrap a new caller on callback: the backend requires the original cookie.
    const target = new URL('/account', window.location.origin);
    if (flow.intent === 'INTENT_DELETE') target.searchParams.set('intent', 'delete');
    if (flow.tariff) target.searchParams.set('tariff', flow.tariff);
    try {
      const result = await request<{ authenticated?: boolean; status?: string; deleted?: boolean }>(
        `/auth/callback/${provider}?${query}`,
      );
      if (result.authenticated || result.deleted) writeAuth('flow');
      if (result.deleted) {
        target.searchParams.delete('intent');
        target.searchParams.set('deleted', '1');
      }
    } catch (error) {
      if (flow.intent === 'INTENT_DELETE') {
        target.searchParams.set('authError', 'callback');
        return target.pathname + target.search;
      }
      if (!(error instanceof AuthRequestError) || error.code !== 'account_not_found') throw error;
      writeAuth('flow');
      target.searchParams.set('authError', 'account_not_found');
    }
    return target.pathname + target.search;
  },
};
