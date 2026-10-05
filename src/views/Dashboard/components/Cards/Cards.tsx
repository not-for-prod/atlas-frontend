'use client';
import { useBalanceVisibility } from '~/shared/ui/BalanceVisibilityProvider';
import { FormattedMessage } from 'react-intl';
import { CardVisual } from '~/entities/card';
import { formatUsd } from '~/entities/client-asset';
import { StatePanel } from '~/shared/ui/StatePanel';
import styles from './Cards.module.css';
export function Cards({ balanceAmount }: { balanceAmount: string | null }) {
  const { visible } = useBalanceVisibility();
  return (
    <section className={styles.section}>
      <header className={styles.header}>
        <div>
          <h2>
            <FormattedMessage id="cards.title" />
          </h2>
          <p>
            <FormattedMessage id="cards.note" />
          </p>
        </div>
        <span className={styles.count}>{balanceAmount === null ? '0' : '1'}</span>
      </header>
      {balanceAmount === null ? (
        <StatePanel state="empty" />
      ) : (
        <>
          <div className={styles.visual}>
            <CardVisual />
          </div>
          <div className={styles.balance}>
            <span>
              <FormattedMessage id="cards.balance" />
            </span>
            <strong>{visible ? formatUsd(balanceAmount) : '••••'}</strong>
          </div>
        </>
      )}
    </section>
  );
}
