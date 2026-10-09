import { type AtlasPaymentV1Payment as Payment } from '~/generated/atlas/model';

// SBP history exposes frozen USD credit; crypto receipts use USDT and crypto instructions.
export function isSbpPayment(payment: Payment) {
  return (
    payment.type === 'PAYMENT_TYPE_DEPOSIT' &&
    payment.amount?.currency === 'USD' &&
    payment.requisite?.crypto == null
  );
}
