'use client';
import { type ReactNode } from 'react';
import { FormattedMessage } from 'react-intl';
import { ActionGrid } from '~/widgets/ActionGrid';
import { Balance } from '~/entities/client-asset';
import { StatePanel } from '~/shared/ui/StatePanel';
import { Activity, Cards } from './components';
import { type DashboardSnapshot } from './model';
import styles from './Dashboard.module.css';
export function Dashboard({
  snapshot,
  onAction,
  onRetry,
  balance,
  activity,
}: {
  snapshot: DashboardSnapshot;
  balance?: ReactNode;
  activity?: ReactNode;
  onAction: (action: 'deposit' | 'issue' | 'history' | 'support') => void;
  onRetry: () => void;
}) {
  return (
    <>
      <header className={styles.heading}>
        <p className={styles.eyebrow}>
          <FormattedMessage id="dashboard.eyebrow" />
        </p>
        <h1>
          <FormattedMessage id="dashboard.title" />
        </h1>
        <p className={styles.description}>
          <FormattedMessage id="dashboard.description" />
        </p>
      </header>
      {snapshot.state !== 'ready' ? (
        <StatePanel state={snapshot.state} onRetry={onRetry} />
      ) : (
        <div className={styles.grid}>
          <div className={styles.left}>
            {balance ?? (
              <Balance availableAmount={snapshot.availableAmount} reservedAmount={snapshot.reservedAmount} />
            )}
            <ActionGrid onSelect={onAction} />
          </div>
          <div className={styles.right}>
            <Cards balanceAmount={snapshot.cardBalanceAmount} />
            {activity ?? <Activity items={snapshot.activity} />}
          </div>
        </div>
      )}
    </>
  );
}
