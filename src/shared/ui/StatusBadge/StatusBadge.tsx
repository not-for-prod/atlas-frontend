import { FormattedMessage } from 'react-intl';
import styles from './StatusBadge.module.css';
export type DisplayStatus = 'success' | 'pending' | 'failed' | 'reserved';
export function StatusBadge({ status }: { status: DisplayStatus }) {
  return (
    <span className={`${styles.badge} ${styles[status]}`}>
      <span aria-hidden="true" /> <FormattedMessage id={`status.${status}`} />
    </span>
  );
}
