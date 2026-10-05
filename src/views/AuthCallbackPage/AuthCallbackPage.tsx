import { AuthCallback } from '~/features/AuthCallback';
export function AuthCallbackPage({ provider }: { provider: string }) {
  return <AuthCallback provider={provider} />;
}
