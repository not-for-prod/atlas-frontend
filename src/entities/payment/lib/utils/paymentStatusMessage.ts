import { type AtlasPaymentV1PaymentStatus } from '~/generated/atlas/model';

const messages: Partial<Record<AtlasPaymentV1PaymentStatus, string>> = {
  PAYMENT_STATUS_PENDING: 'pending',
  PAYMENT_STATUS_INSPECTION: 'inspection',
  PAYMENT_STATUS_COMPLETED: 'received',
  PAYMENT_STATUS_FAILED: 'failed',
};

export function paymentStatusMessage(
  status?: AtlasPaymentV1PaymentStatus,
  method: 'crypto' | 'sbp' = 'crypto',
) {
  return `${method}.${(status && messages[status]) || 'statusUnknown'}`;
}
