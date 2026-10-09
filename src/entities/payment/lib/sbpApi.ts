import {
  type AtlasPaymentV1SbpPreview as SbpPreview,
  type AtlasPaymentV1SbpPayment as SbpPayment,
  type AtlasPaymentV1SbpPaymentQr as SbpPaymentQr,
} from '~/generated/atlas/model';
import { Decimal, isDecimalAmount } from '~/shared/lib/decimal';
import { PaymentRequestError, request } from './api';

function isQuote(value: SbpPreview | SbpPayment | undefined): boolean {
  if (
    !value ||
    typeof value.id !== 'string' ||
    !value.id ||
    value.amount?.currency !== 'RUB' ||
    value.fee?.currency !== 'RUB' ||
    value.credit?.currency !== 'USD' ||
    !isDecimalAmount(value.amount.amount) ||
    !isDecimalAmount(value.fee.amount) ||
    !isDecimalAmount(value.credit.amount) ||
    !isDecimalAmount(value.exchangeRate)
  )
    return false;
  const amount = new Decimal(value.amount.amount);
  const fee = new Decimal(value.fee.amount);
  const credit = new Decimal(value.credit.amount);
  const rate = new Decimal(value.exchangeRate);
  return (
    amount.gt(0) &&
    amount.decimalPlaces() <= 2 &&
    fee.lt(amount) &&
    fee.decimalPlaces() <= 2 &&
    credit.gt(0) &&
    credit.decimalPlaces() <= 2 &&
    rate.gt(0) &&
    credit.eq(amount.minus(fee).times(rate).toDecimalPlaces(2, Decimal.ROUND_DOWN))
  );
}
function isPayment(value: SbpPayment | undefined): value is SbpPayment {
  if (
    !isQuote(value) ||
    typeof value?.previewId !== 'string' ||
    !value.previewId ||
    (value.paymentLink !== undefined && typeof value.paymentLink !== 'string') ||
    !['creating', 'ambiguous', 'pending', 'completed', 'failed'].includes(value.status ?? '') ||
    !Number.isFinite(Date.parse(value.createdAt ?? '')) ||
    !Number.isFinite(Date.parse(value.updatedAt ?? ''))
  )
    return false;
  if (value.paymentLink) {
    try {
      const url = new URL(value.paymentLink);
      if (url.protocol !== 'https:' || !url.hostname || url.username || url.password) return false;
    } catch {
      return false;
    }
  }
  return true;
}
export async function getSbpPreview(amount: string, signal?: AbortSignal): Promise<SbpPreview> {
  const data = await request(
    '/v1/payments/sbp/previews',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ usdAmount: amount }),
    },
    signal,
  );
  const preview: SbpPreview | undefined = data?.preview;
  if (
    !isQuote(preview) ||
    !preview ||
    !Number.isFinite(Date.parse(preview.expiresAt ?? '')) ||
    new Decimal(preview.credit!.amount!).lt(amount)
  )
    throw new PaymentRequestError(503);
  return preview;
}
export async function createSbpPayment(preview: SbpPreview): Promise<SbpPayment> {
  const data = await request('/v1/payments/sbp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ previewId: preview.id }),
  });
  const payment: SbpPayment | undefined = data?.payment;
  if (
    !isPayment(payment) ||
    payment.previewId !== preview.id ||
    payment.amount?.amount !== preview.amount?.amount ||
    payment.fee?.amount !== preview.fee?.amount ||
    payment.credit?.amount !== preview.credit?.amount ||
    payment.exchangeRate !== preview.exchangeRate
  )
    throw new PaymentRequestError(503);
  return payment;
}
export async function getSbpPayment(id: string, signal?: AbortSignal): Promise<SbpPayment> {
  const data = await request(`/v1/payments/sbp/${encodeURIComponent(id)}`, {}, signal);
  const payment: SbpPayment | undefined = data?.payment;
  if (!isPayment(payment) || payment.id !== id) throw new PaymentRequestError(503);
  return payment;
}

export async function getSbpPaymentQr(id: string, signal?: AbortSignal): Promise<SbpPaymentQr> {
  const data = await request(`/v1/payments/sbp/${encodeURIComponent(id)}/qr`, {}, signal);
  const qr: SbpPaymentQr | undefined = data?.qr;
  if (
    !qr ||
    ![
      'SBP_QR_STATUS_PENDING',
      'SBP_QR_STATUS_AVAILABLE',
      'SBP_QR_STATUS_EXPIRED',
      'SBP_QR_STATUS_CHECKOUT_REQUIRED',
    ].includes(qr.status ?? '')
  )
    throw new PaymentRequestError(503);
  if (
    qr.status === 'SBP_QR_STATUS_AVAILABLE' &&
    (!qr.url ||
      qr.url.length > 4096 ||
      !/^https:\/\/qr[.]nspk[.]ru\/[A-Za-z0-9]+(?:[?][^#\s]*)?$/.test(qr.url) ||
      !Number.isFinite(Date.parse(qr.expiresAt ?? '')))
  )
    throw new PaymentRequestError(503);
  return qr;
}
