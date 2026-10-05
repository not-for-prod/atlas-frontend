'use client';
import { useEffect } from 'react';
import { Alert, Button, Group, Paper, Stack, Text, TextInput } from '@mantine/core';
import { FormattedMessage } from 'react-intl';
import { TopUpRequestError, isTopUpTerminal } from '~/entities/card';
import { formatUsd } from '~/entities/client-asset';
import { useTopUpCard } from './lib/hooks/useTopUpCard';
export function TopUpCard({ cardId, onAccepted }: { cardId: string; onAccepted?: () => void }) {
  const flow = useTopUpCard(cardId);
  const accepted =
    flow.mutation.isSuccess &&
    !!flow.order &&
    !['CARD_TOP_UP_STATUS_FAILED', 'CARD_TOP_UP_STATUS_REJECTED'].includes(flow.order.status || '');
  useEffect(() => {
    if (accepted) onAccepted?.();
  }, [accepted, onAccepted]);
  if (flow.loading)
    return (
      <Text>
        <FormattedMessage id="topup.loading" />
      </Text>
    );
  if (flow.unavailable)
    return (
      <Alert color="red">
        <Stack>
          <FormattedMessage id="topup.unavailable" />
          <Button onClick={() => void flow.refresh()}>
            <FormattedMessage id="issuance.refresh" />
          </Button>
        </Stack>
      </Alert>
    );
  if (flow.order) {
    const order = flow.order;
    return (
      <Stack aria-live="polite">
        <Alert
          color={
            order.status === 'CARD_TOP_UP_STATUS_COMPLETED'
              ? 'green'
              : ['CARD_TOP_UP_STATUS_FAILED', 'CARD_TOP_UP_STATUS_REJECTED'].includes(order.status || '')
                ? 'red'
                : 'blue'
          }
        >
          <FormattedMessage id={`topup.${order.status}`} />
        </Alert>
        <Text>
          <FormattedMessage id="topup.amount" />: {formatUsd(order.amount!.amount!)}
        </Text>
        <Text>
          <FormattedMessage id="topup.fee" />: {formatUsd(order.fee!.amount!)}
        </Text>
        {isTopUpTerminal(order) && (
          <Button onClick={flow.startNew}>
            <FormattedMessage id="topup.new" />
          </Button>
        )}
        {flow.progress.isError && (
          <Alert color="red">
            <FormattedMessage id="issuance.pollError" />
            <Button variant="subtle" onClick={() => void flow.progress.refetch()}>
              <FormattedMessage id="issuance.refresh" />
            </Button>
          </Alert>
        )}
      </Stack>
    );
  }
  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        flow.submit();
      }}
    >
      <Stack>
        <TextInput
          label={<FormattedMessage id="topup.amount" />}
          description={<FormattedMessage id="topup.netAmount" />}
          error={
            flow.amountError ? (
              <FormattedMessage
                id={flow.amountError}
                values={{
                  minimum:
                    flow.limits?.minimalAmount !== undefined ? formatUsd(flow.limits.minimalAmount) : '',
                  maximum:
                    flow.limits?.maximumAmount !== undefined ? formatUsd(flow.limits.maximumAmount) : '',
                }}
              />
            ) : flow.insufficient ? (
              <FormattedMessage id="topup.insufficient" />
            ) : undefined
          }
          inputMode="decimal"
          value={flow.input}
          onChange={(event) => flow.setInput(event.currentTarget.value)}
          disabled={flow.locked}
          required
        />
        <Stack gap={4}>
          {flow.limits?.minimalAmount !== undefined && (
            <Text size="sm" c="dimmed">
              <FormattedMessage
                id="cardTariff.topupMinimum"
                values={{ amount: formatUsd(flow.limits.minimalAmount) }}
              />
            </Text>
          )}
          {flow.limits?.maximumAmount !== undefined && (
            <Text size="sm" c="dimmed">
              <FormattedMessage
                id="cardTariff.topupMaximum"
                values={{ amount: formatUsd(flow.limits.maximumAmount) }}
              />
            </Text>
          )}
          {flow.balance.data && (
            <Text size="sm" c="dimmed">
              <FormattedMessage
                id="topup.available"
                values={{ amount: formatUsd(flow.balance.data.availableAmount) }}
              />
            </Text>
          )}
        </Stack>
        {flow.constraintsLoading && (
          <Text size="sm">
            <FormattedMessage id="topup.constraintsLoading" />
          </Text>
        )}
        {flow.constraintsError && (
          <Alert color="red" role="alert">
            <Stack gap="xs">
              <FormattedMessage id="topup.constraintsError" />
              <Button variant="subtle" onClick={() => void flow.refreshConstraints()}>
                <FormattedMessage id="issuance.refresh" />
              </Button>
            </Stack>
          </Alert>
        )}
        <Paper withBorder p="md" radius="lg" aria-live="polite" aria-busy={flow.quote.isFetching}>
          <Stack gap="xs">
            <Group justify="space-between">
              <Text size="sm">
                <FormattedMessage id="topup.received" />
              </Text>
              <Text fw={700} size="xl">
                {flow.calculation ? formatUsd(flow.calculation.received) : '—'}
              </Text>
            </Group>
            <Group justify="space-between">
              <Text size="sm" c="dimmed">
                <FormattedMessage id="topup.fee" />
              </Text>
              <Text size="sm">{flow.calculation ? formatUsd(flow.calculation.fee) : '—'}</Text>
            </Group>
            <Group justify="space-between">
              <Text fw={600}>
                <FormattedMessage id="topup.total" />
              </Text>
              <Text fw={600}>{flow.calculation ? formatUsd(flow.calculation.total) : '—'}</Text>
            </Group>
            {flow.quote.isFetching ? (
              <Text size="sm" c="dimmed">
                <FormattedMessage id="topup.quoteLoading" />
              </Text>
            ) : (
              !flow.calculation && (
                <Text size="sm" c="dimmed">
                  <FormattedMessage id="topup.calculatorHint" />
                </Text>
              )
            )}
          </Stack>
        </Paper>
        {flow.quote.isError && !flow.amountError && (
          <Alert color="red">
            <FormattedMessage id="topup.quoteError" />
            <Button variant="subtle" onClick={() => void flow.quote.refetch()}>
              <FormattedMessage id="issuance.refresh" />
            </Button>
          </Alert>
        )}
        <Text size="sm" c="dimmed">
          <FormattedMessage id="topup.policy" />
        </Text>
        {flow.mutation.isError && (
          <Alert color="red" role="alert">
            <FormattedMessage
              id={
                flow.mutation.error instanceof TopUpRequestError && flow.mutation.error.insufficient
                  ? 'topup.insufficient'
                  : flow.mutation.error instanceof TopUpRequestError && flow.mutation.error.quoteChanged
                    ? 'topup.quoteChanged'
                    : 'topup.submitError'
              }
            />
          </Alert>
        )}
        <Button type="submit" loading={flow.mutation.isPending} disabled={!flow.canSubmit}>
          <FormattedMessage id={flow.mutation.isError ? 'issuance.retry' : 'topup.submit'} />
        </Button>
      </Stack>
    </form>
  );
}
