import { Decimal } from '~/shared/lib/decimal';
import { FormattedDate, FormattedMessage, useIntl } from 'react-intl';
import {
  formatPaymentMoney,
  paymentStatusMessage,
  PaymentIcon,
  isSbpPayment,
  type Payment,
} from '~/entities/payment';
import styles from './PaymentHistoryRow.module.css';

export function PaymentHistoryRow({ payment, onSelect }: { payment: Payment; onSelect: () => void }) {
  const intl = useIntl();
  const cardOperation =
    payment.type === 'PAYMENT_TYPE_CARD_ISSUE' || payment.type === 'PAYMENT_TYPE_CARD_TOP_UP';
  const sbp = isSbpPayment(payment);
  const operationMessage =
    payment.type === 'PAYMENT_TYPE_CARD_TOP_UP'
      ? 'history.cardTopUp'
      : cardOperation
        ? 'history.cardIssue'
        : sbp
          ? 'history.sbpDeposit'
          : 'history.deposit';
  const incoming = !cardOperation && payment.status === 'PAYMENT_STATUS_COMPLETED';
  const charged =
    cardOperation &&
    ['PAYMENT_STATUS_COMPLETED', 'PAYMENT_STATUS_FAILED'].includes(payment.status ?? '') &&
    new Decimal(payment.amount!.amount!).gt('0');
  const completed = payment.status === 'PAYMENT_STATUS_COMPLETED';
  const failed = payment.status === 'PAYMENT_STATUS_FAILED';
  const address = payment.requisite?.crypto?.address;
  const addressLabel = address && intl.formatMessage({ id: 'history.destination' }, { address });
  return (
    <li className={styles.row}>
      <button
        type="button"
        className={styles.open}
        onClick={onSelect}
        aria-haspopup="dialog"
        aria-label={intl.formatMessage(
          { id: 'payment.open' },
          {
            amount: formatPaymentMoney(payment.amount),
            date: intl.formatDate(payment.createdAt, {
              day: 'numeric',
              month: 'long',
              hour: '2-digit',
              minute: '2-digit',
            }),
          },
        )}
      />
      <PaymentIcon payment={payment} size={cardOperation ? 40 : 44} />
      <div className={styles.description}>
        <p className={styles.title}>
          <FormattedMessage id={operationMessage} />
        </p>
        <p className={styles.detail} title={addressLabel} aria-label={addressLabel}>
          {cardOperation ? (
            <FormattedMessage
              id={payment.status === 'PAYMENT_STATUS_PENDING' ? 'payment.reserved' : 'payment.charged'}
            />
          ) : sbp ? (
            <FormattedMessage id="history.sbpMethod" />
          ) : address ? (
            `${address.slice(0, 6)}…${address.slice(-5)}`
          ) : (
            'USDT · TRON'
          )}
        </p>
        {!completed && (
          <p className={failed ? styles.failed : styles.status}>
            {cardOperation ? (
              <FormattedMessage id="payment.statusValue" values={{ status: payment.status }} />
            ) : (
              <FormattedMessage id={paymentStatusMessage(payment.status, sbp ? 'sbp' : 'crypto')} />
            )}
          </p>
        )}
      </div>
      <div className={styles.summary}>
        <p className={incoming ? styles.incoming : styles.amount}>
          {incoming ? '+' : charged ? '−' : ''}
          {formatPaymentMoney(payment.amount)}
        </p>
        <time dateTime={payment.createdAt} className={styles.time}>
          <FormattedDate value={payment.createdAt} hour="2-digit" minute="2-digit" />
        </time>
      </div>
    </li>
  );
}
