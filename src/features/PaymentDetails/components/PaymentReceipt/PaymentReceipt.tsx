import { Decimal } from '~/shared/lib/decimal';
import { FormattedDate, FormattedMessage } from 'react-intl';
import { formatPaymentMoney, PaymentIcon, isSbpPayment, type Payment } from '~/entities/payment';
import styles from './PaymentReceipt.module.css';

export function PaymentReceipt({ payment }: { payment: Payment }) {
  const crypto = payment.requisite?.crypto;
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
  return (
    <div>
      <div className={styles.summary}>
        <PaymentIcon payment={payment} size={52} />
        <p className={styles.amount} data-completed={incoming}>
          {incoming ? '+' : charged ? '−' : ''}
          {formatPaymentMoney(payment.amount)}
        </p>
      </div>
      <dl className={styles.details}>
        <div>
          <dt>
            <FormattedMessage id="payment.status" />
          </dt>
          <dd>
            <span className={styles.status} data-status={payment.status}>
              <FormattedMessage id="payment.statusValue" values={{ status: payment.status }} />
            </span>
          </dd>
        </div>
        <div>
          <dt>
            <FormattedMessage id="payment.operation" />
          </dt>
          <dd>
            <FormattedMessage id={operationMessage} />
          </dd>
        </div>
        {!sbp && (
          <div>
            <dt>
              <FormattedMessage id="payment.fee" />
            </dt>
            <dd>{formatPaymentMoney(payment.fee) ?? <FormattedMessage id="payment.notProvided" />}</dd>
          </div>
        )}
        {cardOperation ? (
          <>
            <div>
              <dt>
                <FormattedMessage id="payment.reserved" />
              </dt>
              <dd>{formatPaymentMoney(payment.reservedAmount)}</dd>
            </div>
            <div>
              <dt>
                <FormattedMessage id="payment.released" />
              </dt>
              <dd>{formatPaymentMoney(payment.releasedAmount)}</dd>
            </div>
            {payment.cardId && (
              <div className={styles.full}>
                <dt>
                  <FormattedMessage id="payment.cardId" />
                </dt>
                <dd>{payment.cardId}</dd>
              </div>
            )}
          </>
        ) : (
          <div>
            <dt>
              <FormattedMessage id="payment.credited" />
            </dt>
            <dd>
              {formatPaymentMoney(payment.creditedAmount) ?? <FormattedMessage id="payment.notProvided" />}
            </dd>
          </div>
        )}
        <div>
          <dt>
            <FormattedMessage id="payment.created" />
          </dt>
          <dd>
            <FormattedDate
              value={payment.createdAt}
              year="numeric"
              month="short"
              day="numeric"
              hour="2-digit"
              minute="2-digit"
            />
          </dd>
        </div>
        {payment.updatedAt && (
          <div>
            <dt>
              <FormattedMessage id="payment.updated" />
            </dt>
            <dd>
              <FormattedDate
                value={payment.updatedAt}
                year="numeric"
                month="short"
                day="numeric"
                hour="2-digit"
                minute="2-digit"
              />
            </dd>
          </div>
        )}
        {crypto?.network && (
          <div>
            <dt>
              <FormattedMessage id="payment.network" />
            </dt>
            <dd>
              {crypto.currency} · {crypto.network.toUpperCase()}
            </dd>
          </div>
        )}
        {crypto?.address && (
          <div className={styles.full}>
            <dt>
              <FormattedMessage id="crypto.address" />
            </dt>
            <dd>{crypto.address}</dd>
          </div>
        )}
        {crypto?.memo && (
          <div className={styles.full}>
            <dt>
              <FormattedMessage id="payment.memo" />
            </dt>
            <dd>{crypto.memo}</dd>
          </div>
        )}
        <div className={styles.full}>
          <dt>
            <FormattedMessage id="payment.id" />
          </dt>
          <dd>{payment.id}</dd>
        </div>
      </dl>
    </div>
  );
}
