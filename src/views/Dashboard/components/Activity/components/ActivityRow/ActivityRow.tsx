import { IconArrowDownLeft, IconArrowUpRight } from '@tabler/icons-react';
import { FormattedMessage } from 'react-intl';
import { formatUsd } from '~/entities/client-asset';
import { StatusBadge } from '~/shared/ui/StatusBadge';
import { type ActivityItem } from '../../../../model';
import styles from './ActivityRow.module.css';
export function ActivityRow({ item }: { item: ActivityItem }) {
  return (
    <li className={styles.row}>
      <span className={`${styles.icon} ${item.kind === 'deposit' ? styles.incoming : ''}`}>
        {item.kind === 'deposit' ? <IconArrowDownLeft size={20} /> : <IconArrowUpRight size={20} />}
      </span>
      <div className={styles.description}>
        <span className={styles.name}>
          <FormattedMessage id={`activity.${item.kind}`} />
        </span>
        <span className={styles.time}>
          <FormattedMessage id={`activity.${item.when}`} />
        </span>
      </div>
      <div className={styles.end}>
        <span className={styles.amount}>
          {item.kind === 'deposit' ? '+' : ''}
          {formatUsd(item.amount)}
        </span>
        <StatusBadge status={item.status} />
      </div>
    </li>
  );
}
