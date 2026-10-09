import Image from 'next/image';
import { IconCreditCard } from '@tabler/icons-react';
import { type AtlasPaymentV1Payment as Payment } from '~/generated/atlas/model';
import { isSbpPayment } from '../../lib/utils/isSbpPayment';
import { UsdtTronIcon } from '../UsdtTronIcon';

export function PaymentIcon({ payment, size = 44 }: { payment: Payment; size?: number }) {
  if (payment.type === 'PAYMENT_TYPE_CARD_ISSUE' || payment.type === 'PAYMENT_TYPE_CARD_TOP_UP')
    return <IconCreditCard size={size} aria-hidden="true" />;
  if (isSbpPayment(payment))
    return <Image src="/payment-methods/sbp.svg" width={size} height={size} alt="СБП" />;
  return <UsdtTronIcon size={size} />;
}
