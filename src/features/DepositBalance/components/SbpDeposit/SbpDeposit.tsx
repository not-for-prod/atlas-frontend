'use client';
import { useEffect, useRef } from 'react';
import { Alert, Button, Group, Loader, Stack, Text, Title } from '@mantine/core';
import { IconArrowLeft } from '@tabler/icons-react';
import { FormattedMessage, useIntl } from 'react-intl';
import { useSbpDeposit } from './lib/hooks/useSbpDeposit';
import { SbpQuote } from './components/SbpQuote';
import { SbpQr } from './components/SbpQr';
export function SbpDeposit({
  amount,
  onBack,
  onClose,
}: {
  amount: string;
  onBack: () => void;
  onClose: () => void;
}) {
  const intl = useIntl();
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    heading.current?.focus();
  }, []);
  const flow = useSbpDeposit(amount);
  const payment = flow.payment.data ?? flow.create.data;
  const terminal = payment && ['completed', 'failed'].includes(payment.status ?? '');
  return (
    <Stack gap="lg">
      <Group justify="space-between">
        <Title ref={heading} tabIndex={-1} order={2} size="h4">
          <FormattedMessage id="cabinet.deposit.bank" />
        </Title>
        {!flow.submitted && (
          <Button variant="subtle" color="dark" leftSection={<IconArrowLeft size={16} />} onClick={onBack}>
            <FormattedMessage id="sbp.back" />
          </Button>
        )}
      </Group>
      {flow.quote.isFetching && !flow.submitted && (
        <Group role="status">
          <Loader size="sm" />
          <Text>
            <FormattedMessage id="sbp.quoting" />
          </Text>
        </Group>
      )}
      {(payment || flow.quote.data) && (
        <SbpQuote
          quote={(payment ?? flow.quote.data)!}
          remainingSeconds={!payment && !flow.submitted ? flow.remainingSeconds : undefined}
        />
      )}
      {!payment && flow.quote.data && (
        <>
          {flow.expired && !flow.submitted && (
            <Text size="sm" c="red.8">
              <FormattedMessage id="sbp.expired" />
            </Text>
          )}
          {flow.expired && !flow.submitted ? (
            <Button loading={flow.quote.isFetching} onClick={() => void flow.quote.refetch()}>
              <FormattedMessage id="sbp.refreshQuote" />
            </Button>
          ) : flow.create.isPending ? (
            <Group role="status">
              <Loader size="sm" />
              <Text>
                <FormattedMessage id="sbp.creating" />
              </Text>
            </Group>
          ) : flow.error && flow.submitted ? (
            <Button onClick={flow.confirm}>
              <FormattedMessage id="sbp.retrySame" />
            </Button>
          ) : null}
        </>
      )}
      {flow.error && (
        <Alert color="red" title={intl.formatMessage({ id: 'sbp.errorTitle' })}>
          <Stack gap="sm">
            <Text size="sm">
              <FormattedMessage id={flow.errorMessage} />
            </Text>
            {!flow.submitted && (
              <Button
                variant="default"
                loading={flow.quote.isFetching}
                onClick={() => void flow.quote.refetch()}
              >
                <FormattedMessage id="sbp.refreshQuote" />
              </Button>
            )}
            {payment && (
              <Button
                variant="default"
                loading={flow.payment.isFetching}
                onClick={() => void flow.payment.refetch()}
              >
                <FormattedMessage id="sbp.refresh" />
              </Button>
            )}
          </Stack>
        </Alert>
      )}
      {payment && (
        <Stack role="status">
          <Text>
            <FormattedMessage id={`sbp.status.${payment.status}`} />
          </Text>
          {payment.status === 'completed' && (
            <Text size="sm">
              <FormattedMessage id="sbp.creditPending" />
            </Text>
          )}
          {!terminal && <SbpQr paymentId={payment.id!} />}
          {!terminal && payment.paymentLink && (
            <Button
              component="a"
              href={payment.paymentLink}
              target="_blank"
              rel="noopener noreferrer"
              referrerPolicy="no-referrer"
            >
              <FormattedMessage id="sbp.openCheckout" />
            </Button>
          )}
          {!terminal && !payment.paymentLink && (
            <Text size="sm" c="dimmed">
              <FormattedMessage id="sbp.recovering" />
            </Text>
          )}
          <Button variant="default" onClick={onClose}>
            <FormattedMessage id="sbp.close" />
          </Button>
        </Stack>
      )}
    </Stack>
  );
}
