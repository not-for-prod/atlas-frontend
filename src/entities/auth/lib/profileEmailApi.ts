import { type CreateResponse, type StartResponse, type VerifyResponse } from '../model';
import { request, authPath, AuthRequestError } from './transport';

export class ProfileEmailRequestError extends AuthRequestError {}
export type ProfileEmail = { email: string; verified: boolean };
export type EmailLink = { transactionId: string; attemptId: string; challengeId: string; expiresAt: string };

export async function getProfileEmail(signal?: AbortSignal): Promise<ProfileEmail> {
  let data: ProfileEmail;
  try {
    data = await request<ProfileEmail>('/auth/profile/email', undefined, signal);
  } catch (error) {
    if (error instanceof AuthRequestError)
      throw new ProfileEmailRequestError(error.code, error.retryAfter, error.status);
    throw error;
  }
  if (
    !data ||
    typeof data.email !== 'string' ||
    typeof data.verified !== 'boolean' ||
    data.verified !== (data.email !== '')
  )
    throw new ProfileEmailRequestError('unavailable');
  return data;
}
async function createEmailLink(email: string): Promise<EmailLink> {
  const current = await getProfileEmail();
  if (current.verified) throw new AuthRequestError('conflict', 0, 409);
  const created = await request<CreateResponse>(authPath('transactions'), { intent: 'INTENT_UPDATE' });
  const transaction = created.transaction;
  const selection = transaction?.availableMethods?.find((method) => method.methodId === 'email_code');
  if (!transaction?.id || !selection) throw new AuthRequestError('method_unavailable', 0, 409);
  const started = await request<StartResponse>(
    authPath(`transactions/${encodeURIComponent(transaction.id)}:startMethod`),
    {
      selection,
      input: { email: email.trim() },
    },
  );
  const pending = started.transaction?.pendingAttempt;
  const expiresAt = started.challenge?.expiresAt;
  if (!pending?.attemptId || !pending.challengeId || !expiresAt) throw new AuthRequestError('unavailable');
  return {
    transactionId: transaction.id,
    attemptId: pending.attemptId,
    challengeId: pending.challengeId,
    expiresAt,
  };
}
export async function startEmailLink(email: string): Promise<EmailLink> {
  try {
    return await createEmailLink(email);
  } catch (error) {
    if (error instanceof AuthRequestError && [401, 403].includes(error.status)) await getProfileEmail();
    throw error;
  }
}
export async function verifyEmailLink({
  link,
  code,
}: {
  link: EmailLink;
  code: string;
}): Promise<ProfileEmail> {
  try {
    const result = await request<VerifyResponse>(
      authPath(`transactions/${encodeURIComponent(link.transactionId)}:verifyMethod`),
      {
        attemptId: link.attemptId,
        challengeId: link.challengeId,
        input: { code },
      },
    );
    if (!result.result || result.transaction?.status !== 'completed')
      throw new AuthRequestError('unavailable');
  } catch (error) {
    // Invalid email proof and an expired session both use 401. Check the protected
    // read before classifying this as session loss; a wrong code keeps the form open.
    if (error instanceof AuthRequestError && [401, 403].includes(error.status)) {
      await getProfileEmail();
    }
    throw error;
  }
  const profile = await getProfileEmail();
  if (!profile.verified) throw new AuthRequestError('unavailable');
  return profile;
}
