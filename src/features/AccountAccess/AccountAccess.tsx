'use client';
import { type ReactNode } from 'react';
import { StatePanel } from '~/shared/ui/StatePanel';
import { useAccountAccess } from './lib/hooks/useAccountAccess';

export function AccountAccess({ children }: { children: ReactNode }) {
  const access = useAccountAccess();
  if (access.isPending) return <StatePanel state="loading" />;
  if (access.isError) return <StatePanel state="error" onRetry={() => void access.refetch()} />;
  if (!access.data?.authenticated) return <StatePanel state="loading" />;
  return children;
}
