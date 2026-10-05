import { Group, Stack, Text } from '@mantine/core';
import { FormattedMessage } from 'react-intl';
import { formatUsd } from '~/entities/client-asset';
import { formatUsdt } from '~/entities/payment';
import styles from '../../DepositBalance.module.css';

// The approved crypto credit rule is 1 USDT = 1 USD, without an Atlas fee.
// See atlas/docs/crypto-deposits.md. Sender-wallet network fees are separate.
export function PaymentPreview({ amount }: { amount: string }) {
  return (
    <Stack gap="sm">
      <Group justify="space-between">
        <Text size="sm">
          <FormattedMessage id="deposit.pay" />
        </Text>
        <Text fw={700} className={styles.amount}>
          {formatUsdt(amount)}
        </Text>
      </Group>
      <Group justify="space-between">
        <Text size="sm">
          <FormattedMessage id="deposit.fee" />
        </Text>
        <Text size="sm">{formatUsd('0')}</Text>
      </Group>
      <Text size="sm" c="dimmed">
        <FormattedMessage id="deposit.rate" />
      </Text>
      <Text size="sm" c="dimmed">
        <FormattedMessage id="deposit.networkFee" />
      </Text>
    </Stack>
  );
}
