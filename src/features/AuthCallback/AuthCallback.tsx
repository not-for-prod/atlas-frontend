'use client';
import { useEffect, useRef } from 'react';
import { authApi } from '~/entities/auth';
export function AuthCallback({ provider }: { provider: string }) {
  const started = useRef(false);
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    const params = new URLSearchParams(window.location.search);
    window.history.replaceState(null, '', window.location.pathname);
    void authApi.callback(provider, params).then(
      (target) => window.location.replace(target),
      () => window.location.replace('/account?authError=callback'),
    );
  }, [provider]);
  return null;
}
