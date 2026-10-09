import { Group, Stack, Text } from '@mantine/core';
import { IconClock } from '@tabler/icons-react';
import { FormattedMessage, useIntl } from 'react-intl';
import { formatPaymentMoney, formatSbpRate, type SbpPreview, type SbpPayment } from '~/entities/payment';
import classes from './SbpQuote.module.css';
export function SbpQuote({
  quote,
  remainingSeconds,
}: {
  quote: SbpPreview | SbpPayment;
  remainingSeconds?: number;
}) {
  const intl = useIntl();
  return (
    <Stack gap="md">
      <Stack gap={4}>
        <Text size="sm" c="dimmed">
          <FormattedMessage id="sbp.pay" />
        </Text>
        <Text fw={700} className={classes.amount}>
          {formatPaymentMoney(quote.amount)}
        </Text>
      </Stack>
      <Group justify="space-between" className={classes.credit}>
        <Text>
          <FormattedMessage id="deposit.received" />
        </Text>
        <Text fw={700}>{formatPaymentMoney(quote.credit)}</Text>
      </Group>
      <Group justify="space-between" gap="sm">
        <Text size="sm" c="dimmed">
          <FormattedMessage id="sbp.rate" values={{ rate: formatSbpRate(quote) }} />
        </Text>
        {remainingSeconds !== undefined && (
          <Group
            gap={4}
            c="red.8"
            wrap="nowrap"
            role="timer"
            aria-live="off"
            aria-label={intl.formatMessage({ id: 'sbp.rateTimer' }, { seconds: remainingSeconds })}
          >
            <IconClock size={16} aria-hidden="true" />
            <Text size="sm" fw={600} className={classes.timer}>
              {`00:${String(remainingSeconds).padStart(2, '0')}`}
            </Text>
          </Group>
        )}
      </Group>
    </Stack>
  );
}
