import { ActionIcon, Group, Stack, Text } from '@mantine/core';
import { IconEye, IconEyeOff } from '@tabler/icons-react';
import { FormattedMessage, useIntl } from 'react-intl';
import { useBalanceVisibility } from '~/shared/ui/BalanceVisibilityProvider';
import { formatUsd } from '~/entities/client-asset';
import styles from './CardBalance.module.css';
export function CardBalance({
  amount,
  withVisibilityToggle = false,
}: {
  amount?: string;
  withVisibilityToggle?: boolean;
}) {
  const { visible, toggle } = useBalanceVisibility();
  const intl = useIntl();
  return (
    <Stack gap={2}>
      <Text className={styles.label}>
        <FormattedMessage id="cards.balance" />
      </Text>
      <Group gap="xs" wrap="nowrap">
        <Text
          className={`${styles.amount} ${amount === undefined ? styles.unavailable : ''}`}
          aria-live="polite"
        >
          {amount === undefined ? (
            <FormattedMessage id="cabinet.card.balanceUnavailable" />
          ) : visible ? (
            formatUsd(amount)
          ) : (
            '••••'
          )}
        </Text>
        {withVisibilityToggle && amount !== undefined && (
          <ActionIcon
            variant="transparent"
            color="var(--visual-ink)"
            size={40}
            radius="xl"
            onClick={toggle}
            aria-pressed={visible}
            aria-label={intl.formatMessage({ id: visible ? 'balance.hide' : 'balance.show' })}
            title={intl.formatMessage({ id: visible ? 'balance.hide' : 'balance.show' })}
          >
            {visible ? <IconEyeOff size={20} aria-hidden="true" /> : <IconEye size={20} aria-hidden="true" />}
          </ActionIcon>
        )}
      </Group>
    </Stack>
  );
}
