import { isPayment } from './utils/isPayment';
import { backendOrigin } from '~/shared/api/backendOrigin';
import {
  type AtlasPaymentV1RequestCryptoDepositResponse,
  type AtlasPaymentV1ListPaymentsResponse,
  type AtlasPaymentV1GetPaymentResponse,
} from '~/generated/atlas/model';
export class PaymentRequestError extends Error {
  constructor(
    public status: number,
    public code?: number,
  ) {
    super('Payment request unavailable');
  }
}
export async function request(path: string, init: RequestInit, signal?: AbortSignal) {
  const response = await fetch(`${backendOrigin()}${path}`, {
    ...init,
    credentials: 'include',
    cache: 'no-store',
    redirect: 'error',
    signal: AbortSignal.any([AbortSignal.timeout(15000), ...(signal ? [signal] : [])]),
  });
  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new PaymentRequestError(response.status, typeof body?.code === 'number' ? body.code : undefined);
  }
  return response.json();
}
export async function requestCryptoAddress(key: string) {
  const data: AtlasPaymentV1RequestCryptoDepositResponse = await request(
    '/v1/payments/crypto-deposit-addresses',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idempotencyKey: key, currency: 'USDT', network: 'tron' }),
    },
  );
  if (
    !data.walletId ||
    !data.requisite?.address ||
    data.requisite.currency !== 'USDT' ||
    data.requisite.network !== 'tron' ||
    data.requisite.memo
  )
    throw new PaymentRequestError(503);
  return data;
}
export async function listPayments(token: string, signal?: AbortSignal) {
  const params = new URLSearchParams({ page_size: '20', page_token: token });
  const data: AtlasPaymentV1ListPaymentsResponse = await request(`/v1/payments?${params}`, {}, signal);
  if (
    !data ||
    typeof data !== 'object' ||
    Array.isArray(data) ||
    (data.payments !== undefined && !Array.isArray(data.payments)) ||
    (data.nextPageToken !== undefined && typeof data.nextPageToken !== 'string') ||
    (data.nextPageToken && (data.nextPageToken === token || !data.payments?.length))
  )
    throw new PaymentRequestError(503);
  if (data.payments?.some((item) => !isPayment(item))) throw new PaymentRequestError(503);
  return data;
}

export async function getPayment(id: string, signal?: AbortSignal) {
  const data: AtlasPaymentV1GetPaymentResponse = await request(
    `/v1/payments/${encodeURIComponent(id)}`,
    {},
    signal,
  );
  if (!isPayment(data?.payment) || data.payment.id !== id) throw new PaymentRequestError(503);
  return data.payment;
}
