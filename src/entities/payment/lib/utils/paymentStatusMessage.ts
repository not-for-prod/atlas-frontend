import { type AtlasPaymentV1PaymentStatus } from '~/generated/atlas/model';

const messages: Partial<Record<AtlasPaymentV1PaymentStatus, string>> = {
  PAYMENT_STATUS_PENDING: 'crypto.pending',
  PAYMENT_STATUS_INSPECTION: 'crypto.inspection',
  PAYMENT_STATUS_COMPLETED: 'crypto.received',
  PAYMENT_STATUS_FAILED: 'crypto.failed',
};

export function paymentStatusMessage(status?: AtlasPaymentV1PaymentStatus) {
  return (status && messages[status]) || 'crypto.statusUnknown';
}
