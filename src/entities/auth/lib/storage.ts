import { authPath } from './transport';
import { backendOrigin } from '~/shared/api/backendOrigin';
type SavedAuth = {
  expiresAt: string;
  transactionId?: string;
  tariff?: string;
  intent?: string;
  attemptId?: string;
  challengeId?: string;
  callbackProvider?: string;
  callbackState?: string;
};
function key(purpose: 'flow') {
  return `atlas.auth:${backendOrigin()}:${authPath('')}:${purpose}`;
}
export function readAuth(purpose: 'flow'): SavedAuth | undefined {
  const name = key(purpose);
  const raw = sessionStorage.getItem(name);
  if (!raw) return;
  try {
    const value = JSON.parse(raw) as SavedAuth;
    if (
      !value ||
      typeof value.expiresAt !== 'string' ||
      !Number.isFinite(Date.parse(value.expiresAt)) ||
      Date.parse(value.expiresAt) <= Date.now() ||
      typeof value.transactionId !== 'string' ||
      !value.transactionId
    )
      throw new Error();
    return value;
  } catch {
    sessionStorage.removeItem(name);
    return;
  }
}
export function writeAuth(purpose: 'flow', value?: SavedAuth) {
  if (value) sessionStorage.setItem(key(purpose), JSON.stringify(value));
  else sessionStorage.removeItem(key(purpose));
}
