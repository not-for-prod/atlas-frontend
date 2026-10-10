'use client';

import { Decimal } from '~/shared/lib/decimal';
import { useEffect, useState, type ReactNode } from 'react';
import { Alert, Button, Stack, Text, TextInput } from '@mantine/core';
import { FormattedMessage } from 'react-intl';
import { IssueProgress, type CardCategory } from '~/entities/card';
import { useKYC } from '~/entities/kyc';
import { formatUsd } from '~/entities/client-asset';
import { useIssueCard } from './lib/hooks/useIssueCard';
export function IssueCard({
  category,
  onLocked,
  verification,
}: {
  category?: CardCategory;
  verification?: ReactNode;
  onLocked: (locked: boolean) => void;
}) {
  const [name, setName] = useState('');
  const flow = useIssueCard();
  const kyc = useKYC(
    category?.id,
    !!category?.requiresKyc && !flow.issue && !flow.loading && !flow.unavailable,
  );
  useEffect(() => {
    onLocked(flow.locked || !!flow.issue);
  }, [flow.locked, flow.issue, onLocked]);
  if (flow.loading)
    return (
      <Text>
        <FormattedMessage id="issuance.loading" />
      </Text>
    );
  if (flow.unavailable)
    return (
      <Alert color="red">
        <Stack>
          <FormattedMessage id="issuance.unavailable" />
          <Button onClick={() => void flow.refresh()}>
            <FormattedMessage id="issuance.refresh" />
          </Button>
        </Stack>
      </Alert>
    );
  if (flow.issue)
    return (
      <Stack aria-live="polite">
        <Alert
          color={
            flow.issue.status === 'CARD_ISSUE_STATUS_COMPLETED'
              ? 'green'
              : ['CARD_ISSUE_STATUS_FAILED', 'CARD_ISSUE_STATUS_REJECTED'].includes(flow.issue.status || '')
                ? 'red'
                : 'blue'
          }
        >
          <FormattedMessage id={`issuance.${flow.issue.status}`} />
        </Alert>
        <IssueProgress issue={flow.issue} />
        <Text>{flow.issue.name}</Text>
        <Text>
          <FormattedMessage id="issuance.price" />: {formatUsd(flow.issue.price!.amount!)}
        </Text>
        <Text>
          <FormattedMessage id="issuance.fee" />: {formatUsd(flow.issue.fee!.amount!)}
        </Text>
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
  const price = category?.fees.issue_price?.fixed;
  const fee = category?.fees.issue_commission?.fixed;
  if (!category)
    return (
      <Text>
        <FormattedMessage id="issuance.select" />
      </Text>
    );
  if (price === undefined || fee === undefined)
    return (
      <Alert>
        <FormattedMessage id="issuance.unavailable" />
      </Alert>
    );
  if (category.requiresKyc && (kyc.isPending || kyc.isError || !kyc.data?.eligible))
    return (
      verification ?? (
        <Alert>
          <FormattedMessage id="kyc.required" />
        </Alert>
      )
    );
  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        flow.submit(category.id, name, price, fee);
      }}
    >
      <Stack>
        <TextInput
          label={<FormattedMessage id="issuance.name" />}
          value={name}
          onChange={(event) => setName(event.currentTarget.value)}
          maxLength={100}
          required
          disabled={flow.locked}
        />
        <Text>
          <FormattedMessage id="issuance.price" />: {formatUsd(price)}
        </Text>
        <Text>
          <FormattedMessage id="issuance.fee" />: {formatUsd(fee)}
        </Text>
        <Text fw={600}>
          <FormattedMessage id="issuance.total" />: {formatUsd(new Decimal(price).plus(fee).toFixed())}
        </Text>
        <Text size="sm" c="dimmed">
          <FormattedMessage id="issuance.policy" />
        </Text>
        {flow.mutation.isError && (
          <Alert color="red">
            <FormattedMessage id="issuance.submitError" />
          </Alert>
        )}
        <Button type="submit" loading={flow.mutation.isPending} disabled={!name.trim()}>
          <FormattedMessage id={flow.mutation.isError ? 'issuance.retry' : 'issuance.submit'} />
        </Button>
      </Stack>
    </form>
  );
}
