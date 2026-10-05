import {
  type AuthorizationV1Transaction,
  type AuthorizationV1MethodSelection,
} from '~/generated/atlas/model';
export {
  type AuthorizationV1GetAuthPolicyResponse as AuthPolicy,
  type AuthorizationV1PolicyRequirement as PolicyRequirement,
  type AuthorizationV1MethodSelection as MethodSelection,
  type AuthorizationV1Transaction as Transaction,
  type AuthorizationV1CreateTransactionResponse as CreateResponse,
  type AuthorizationV1GetTransactionResponse as TransactionResponse,
  type AuthorizationV1StartMethodResponse as StartResponse,
  type AuthorizationV1VerifyMethodResponse as VerifyResponse,
} from '~/generated/atlas/model';
export type AuthIntent = 'INTENT_SIGN_IN' | 'INTENT_SIGN_UP' | 'INTENT_DELETE';
export type AuthProgress = {
  authenticated: boolean;
  deleted?: boolean;
  initializing?: boolean;
  transaction?: AuthorizationV1Transaction;
  challengeExpiresAt?: string;
  redirectUrl?: string;
  tariff?: string;
};
export type StartInput = {
  intent: AuthIntent;
  selection: AuthorizationV1MethodSelection;
  email?: string;
  tariff?: string;
};
