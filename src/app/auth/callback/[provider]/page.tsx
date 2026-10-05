import { AuthCallbackPage } from '~/views/AuthCallbackPage';
export default async function Page({ params }: { params: Promise<{ provider: string }> }) {
  return <AuthCallbackPage provider={(await params).provider} />;
}
