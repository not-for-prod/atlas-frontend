import { IconCreditCard } from '@tabler/icons-react';
import { FormattedDate, FormattedMessage, useIntl } from 'react-intl';
import { cardOperationTime, formatCardOperationMoney, type CardOperation } from '~/entities/card';
import styles from '../PaymentHistoryRow/PaymentHistoryRow.module.css';
import operationStyles from './CardOperationRow.module.css';
export function CardOperationRow({
  operation,
  onSelect,
}: {
  operation: CardOperation;
  onSelect: () => void;
}) {
  const intl = useIntl();
  const date = cardOperationTime(operation.transactionTime);
  const type = operation.type?.replace('CARD_OPERATION_TYPE_', '').toLowerCase() ?? 'unspecified';
  const status = operation.status?.replace('CARD_OPERATION_STATUS_', '').toLowerCase() ?? 'unspecified';
  const completed = status === 'completed';
  const incoming = completed && ['refund', 'top_up'].includes(type);
  return (
    <li className={styles.row}>
      <button
        type="button"
        className={styles.open}
        onClick={onSelect}
        aria-haspopup="dialog"
        aria-label={intl.formatMessage(
          { id: 'cardOperation.open' },
          {
            name: operation.merchantName || intl.formatMessage({ id: `cardOperation.type.${type}` }),
            id: operation.id,
          },
        )}
      />
      <IconCreditCard size={40} aria-hidden="true" />
      <div className={styles.description}>
        <p className={styles.title}>
          {operation.merchantName || <FormattedMessage id={`cardOperation.type.${type}`} />}
        </p>
        {operation.merchantName && (
          <p className={styles.detail}>
            <FormattedMessage id={`cardOperation.type.${type}`} />
          </p>
        )}
        <p className={['declined', 'canceled'].includes(status) ? styles.failed : styles.status}>
          <FormattedMessage id={`cardOperation.status.${status}`} />
        </p>
        {operation.fee && (
          <p className={`${styles.detail} ${operationStyles.money}`}>
            <FormattedMessage id="cardOperation.fee" />: {formatCardOperationMoney(operation.fee)}
          </p>
        )}
        {operation.settlement && (
          <p className={`${styles.detail} ${operationStyles.money}`}>
            <FormattedMessage id="cardOperation.settlement" />:{' '}
            {formatCardOperationMoney(operation.settlement)}
          </p>
        )}
      </div>
      <div className={styles.summary}>
        <p className={incoming ? styles.incoming : styles.amount}>
          {incoming && operation.amount ? '+' : ''}
          {formatCardOperationMoney(operation.amount) || (
            <FormattedMessage id="cardOperation.amountUnavailable" />
          )}
        </p>
        <time dateTime={date ? operation.transactionTime : undefined} className={styles.time}>
          {date ? (
            <FormattedDate value={date} hour="2-digit" minute="2-digit" />
          ) : (
            operation.transactionTime || <FormattedMessage id="cardOperation.dateUnavailable" />
          )}
        </time>
      </div>
    </li>
  );
}
