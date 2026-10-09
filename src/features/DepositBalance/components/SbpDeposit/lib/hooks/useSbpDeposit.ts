import { useCallback, useEffect, useRef, useState } from 'react';
import { PaymentRequestError, useSbpPreview, useCreateSbpPayment, useSbpPayment } from '~/entities/payment';
export function useSbpDeposit(amount: string) {
  const quote = useSbpPreview(amount);
  const create = useCreateSbpPayment();
  const payment = useSbpPayment(create.data?.id);
  const [submitted, setSubmitted] = useState(false);
  const [clock, setClock] = useState(() => Date.now());
  const remainingSeconds = quote.data?.expiresAt
    ? Math.max(0, Math.ceil((Date.parse(quote.data.expiresAt) - clock) / 1000))
    : undefined;
  const expired = remainingSeconds === 0;
  useEffect(() => {
    if (!quote.data?.expiresAt || submitted) return;
    const delay = Date.parse(quote.data.expiresAt) - Date.now();
    const timer = setTimeout(() => setClock(Date.now()), Math.max(0, delay));
    const ticker = setInterval(() => setClock(Date.now()), 1000);
    return () => {
      clearTimeout(timer);
      clearInterval(ticker);
    };
  }, [quote.data, submitted]);
  const error = create.error ?? payment.error ?? quote.error;
  const errorMessage =
    error instanceof PaymentRequestError && [401, 403].includes(error.status)
      ? 'crypto.signIn'
      : submitted && !create.data
        ? 'sbp.unknown'
        : error instanceof PaymentRequestError && error.status === 503
          ? 'sbp.unavailable'
          : 'sbp.error';
  const mutate = create.mutate;
  const confirm = useCallback(() => {
    if (!quote.data || create.isPending || (Date.parse(quote.data.expiresAt!) <= Date.now() && !submitted))
      return;
    setSubmitted(true);
    mutate(quote.data);
  }, [quote.data, create.isPending, submitted, mutate]);
  const admitted = useRef<string>(undefined);
  useEffect(() => {
    if (!quote.data || submitted || Date.parse(quote.data.expiresAt!) <= Date.now()) return;
    const id = quote.data.id;
    const timer = setTimeout(() => {
      if (admitted.current === id) return;
      admitted.current = id;
      confirm();
    }, 0);
    return () => clearTimeout(timer);
  }, [quote.data, submitted, confirm]);
  return { quote, create, payment, submitted, expired, remainingSeconds, error, errorMessage, confirm };
}
