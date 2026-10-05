import { type ReactNode } from 'react';
import { Text, Title } from '@mantine/core';
import styles from './PaymentMethodRow.module.css';

type PaymentMethodRowProps = {
  icon: ReactNode;
  title: ReactNode;
  description: ReactNode;
  action: ReactNode;
  children?: ReactNode;
  onSelect?: () => void;
  selectionLabel?: string;
  loading?: boolean;
};

export function PaymentMethodRow({
  icon,
  title,
  description,
  action,
  children,
  onSelect,
  selectionLabel,
  loading,
}: PaymentMethodRowProps) {
  return (
    <li className={styles.item}>
      <div className={styles.row}>
        {onSelect && (
          <button
            type="button"
            className={styles.select}
            onClick={onSelect}
            aria-label={selectionLabel}
            aria-busy={loading}
            disabled={loading}
          />
        )}
        <div className={styles.icon} aria-hidden="true">
          {icon}
        </div>
        <div className={styles.content}>
          <Title order={2} size="h4">
            {title}
          </Title>
          <Text size="sm" c="dimmed" mt={4}>
            {description}
          </Text>
        </div>
        {action && <div className={styles.action}>{action}</div>}
      </div>
      {children && <div className={styles.details}>{children}</div>}
    </li>
  );
}
