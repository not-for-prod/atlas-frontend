import { useEffect, useState } from 'react';
import { AuthRequestError, useProfileEmail, type EmailLink } from '~/entities/auth';
export function useEmailVerification() {
  const state = useProfileEmail();
  const [opened, setOpened] = useState(false);
  const [link, setLink] = useState<EmailLink>();
  const [email, setEmail] = useState('');
  const [retryAt, setRetryAt] = useState(0);
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!opened) return;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [opened]);
  const close = () => {
    if (state.start.isPending || state.verify.isPending) return;
    setOpened(false);
    setLink(undefined);
    setEmail('');
    state.start.reset();
    state.verify.reset();
  };
  const send = (address: string) => {
    setEmail(address);
    state.verify.reset();
    state.start.mutate(address, {
      onSuccess: (next) => {
        setLink(next);
        setRetryAt(Date.now() + 60000);
        setNow(Date.now());
      },
      onError: (error) => {
        if (error instanceof AuthRequestError && error.retryAfter > 0) {
          setRetryAt(Date.now() + error.retryAfter * 1000);
          setNow(Date.now());
        }
      },
    });
  };
  const verify = (code: string) => {
    if (!link) return;
    state.verify.mutate(
      { link, code },
      {
        onSuccess: () => {
          setOpened(false);
          setLink(undefined);
          setEmail('');
        },
      },
    );
  };
  const error = state.verify.error || state.start.error;
  return {
    ...state,
    opened,
    open: () => setOpened(true),
    close,
    link,
    email,
    send,
    verifyCode: verify,
    restart: () => {
      setLink(undefined);
      state.start.reset();
      state.verify.reset();
    },
    pending: state.start.isPending || state.verify.isPending,
    error: error instanceof AuthRequestError ? error.code : error ? 'unavailable' : undefined,
    retryAfter: Math.max(0, Math.ceil((retryAt - now) / 1000)),
    expired: !!link && now >= Date.parse(link.expiresAt),
  };
}
