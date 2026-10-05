import { useIntl } from 'react-intl';
import { IconArrowDownLeft, IconCreditCard, IconHistory, IconMessageCircle } from '@tabler/icons-react';
import { ActionTile } from '~/shared/ui/ActionTile';
import styles from './ActionGrid.module.css';
export function ActionGrid({
  onSelect,
}: {
  onSelect: (action: 'deposit' | 'issue' | 'history' | 'support') => void;
}) {
  const intl = useIntl();
  return (
    <nav className={styles.grid} aria-label={intl.formatMessage({ id: 'a11y.actions' })}>
      <ActionTile
        label="action.deposit"
        icon={<IconArrowDownLeft />}
        accent
        onSelect={() => onSelect('deposit')}
      />
      <ActionTile label="action.issue" icon={<IconCreditCard />} onSelect={() => onSelect('issue')} />
      <ActionTile label="action.history" icon={<IconHistory />} onSelect={() => onSelect('history')} />
      <ActionTile label="action.support" icon={<IconMessageCircle />} onSelect={() => onSelect('support')} />
    </nav>
  );
}
