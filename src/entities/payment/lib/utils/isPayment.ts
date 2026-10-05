import { isDecimalAmount } from '~/shared/lib/decimal';
import {
  type AtlasPaymentV1Payment as Payment,
  type AtlasCommonV1Money as Money,
} from '~/generated/atlas/model';

function isMoney(value: Money) {
  return isDecimalAmount(value?.amount) && ['USD', 'RUB', 'USDT'].includes(value.currency ?? '');
}

export function isPayment(value: unknown): value is Payment {
  if (!value || typeof value !== 'object') return false;
  const payment = value as Payment;
  const crypto = payment.requisite?.crypto;
  const cardOperation =
    payment.type === 'PAYMENT_TYPE_CARD_ISSUE' || payment.type === 'PAYMENT_TYPE_CARD_TOP_UP';
  return (
    typeof payment.id === 'string' &&
    !!payment.id &&
    typeof payment.createdAt === 'string' &&
    Number.isFinite(Date.parse(payment.createdAt)) &&
    (payment.updatedAt == null ||
      (typeof payment.updatedAt === 'string' && Number.isFinite(Date.parse(payment.updatedAt)))) &&
    (payment.type === 'PAYMENT_TYPE_DEPOSIT' || cardOperation) &&
    [
      'PAYMENT_STATUS_PENDING',
      'PAYMENT_STATUS_INSPECTION',
      'PAYMENT_STATUS_COMPLETED',
      'PAYMENT_STATUS_FAILED',
    ].includes(payment.status ?? '') &&
    !!payment.amount &&
    isMoney(payment.amount) &&
    payment.amount.currency === (cardOperation ? 'USD' : 'USDT') &&
    (!cardOperation ||
      (payment.requisite == null &&
        !!payment.fee &&
        !!payment.reservedAmount &&
        isMoney(payment.reservedAmount) &&
        payment.reservedAmount.currency === 'USD' &&
        !!payment.releasedAmount &&
        isMoney(payment.releasedAmount) &&
        payment.releasedAmount.currency === 'USD' &&
        (payment.cardId == null || (typeof payment.cardId === 'string' && !!payment.cardId)))) &&
    (payment.fee == null || (isMoney(payment.fee) && payment.fee.currency === payment.amount.currency)) &&
    (payment.creditedAmount == null || isMoney(payment.creditedAmount)) &&
    (crypto == null ||
      (typeof crypto.address === 'string' &&
        typeof crypto.network === 'string' &&
        typeof crypto.currency === 'string' &&
        (crypto.memo == null || typeof crypto.memo === 'string')))
  );
}
