'use client';
import { useEffect, useRef } from 'react';
import { completeTelegramConnection } from '~/entities/notification';
import { StatePanel } from '~/shared/ui/StatePanel';
export function TelegramConnectionCallback() {
  const started = useRef(false);
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    const params = new URLSearchParams(window.location.search);
    window.history.replaceState(null, '', window.location.pathname);
    void completeTelegramConnection(params).then(
      () => window.location.replace('/cabinet/profile?notificationConnection=connected'),
      () => window.location.replace('/cabinet/profile?notificationConnection=error'),
    );
  }, []);
  return <StatePanel state="loading" />;
}
