'use client';
import { ActionIcon, Group, Stack, Title } from '@mantine/core';
import { useBalanceVisibility } from '~/shared/ui/BalanceVisibilityProvider';
import { IconEye, IconEyeOff, IconRefresh } from '@tabler/icons-react';
import { FormattedMessage, useIntl } from 'react-intl';
import { formatUsd } from '../../lib';
import styles from './Balance.module.css';
export function Balance({
  availableAmount,
  reservedAmount,
  onRefresh,
  refreshing = false,
}: {
  availableAmount: string;
  reservedAmount: string;
  onRefresh?: () => void;
  refreshing?: boolean;
}) {
  const { visible, toggle } = useBalanceVisibility();
  const intl = useIntl();
  return (
    <Stack component="section" aria-label={intl.formatMessage({ id: 'balance.label' })}>
      <Group justify="space-between" wrap="nowrap">
        <Title order={2} size="h3">
          <FormattedMessage id="balance.label" />
        </Title>
        {onRefresh && (
          <ActionIcon
            variant="transparent"
            color="dark"
            size={40}
            radius="xl"
            aria-label={intl.formatMessage({ id: 'balance.refresh' })}
            title={intl.formatMessage({ id: 'balance.refresh' })}
            loading={refreshing}
            onClick={onRefresh}
          >
            <IconRefresh size={20} aria-hidden="true" />
          </ActionIcon>
        )}
      </Group>
      <div className={styles.balance}>
        <button
          type="button"
          className={styles.toggle}
          onClick={toggle}
          aria-label={intl.formatMessage({ id: visible ? 'balance.hide' : 'balance.show' })}
          aria-pressed={visible}
        >
          {visible ? <IconEyeOff size={20} /> : <IconEye size={20} />}
        </button>
        <div className={styles.value} aria-live="polite">
          {visible ? formatUsd(availableAmount) : '••••••'}
        </div>
        <div className={styles.details}>
          <span>
            <i />
            <FormattedMessage id="balance.available" />
          </span>
          <span>
            <FormattedMessage id="balance.reserved" /> · {visible ? formatUsd(reservedAmount) : '••••'}
          </span>
          <span>
            <FormattedMessage id="balance.note" />
          </span>
        </div>
      </div>
    </Stack>
  );
}
