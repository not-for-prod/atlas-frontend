import { Alert, Button, Stack } from '@mantine/core';
import { FormattedMessage } from 'react-intl';
import { IssueProgress } from '~/entities/card';
import { type Payment } from '~/entities/payment';
import { StatePanel } from '~/shared/ui/StatePanel';
import { usePaymentProgress } from '../../lib/hooks/usePaymentProgress';
export function PaymentProgress({ payment }: { payment: Payment }) {
  const progress = usePaymentProgress(payment);
  if (progress.isPending) return <StatePanel state="loading" />;
  if (!progress.data?.order) return <StatePanel state="error" onRetry={() => void progress.refetch()} />;
  const data = progress.data;
  const status = data.order!.status || '';
  return (
    <Stack aria-live="polite">
      <Alert
        color={
          status.endsWith('_COMPLETED')
            ? 'green'
            : status.endsWith('_FAILED') || status.endsWith('_REJECTED')
              ? 'red'
              : 'blue'
        }
      >
        <FormattedMessage id={`${data.kind === 'issue' ? 'issuance' : 'topup'}.${status}`} />
      </Alert>
      {data.kind === 'issue' && <IssueProgress issue={data.order!} />}
      {progress.isError && (
        <Alert color="red">
          <FormattedMessage id="issuance.pollError" />
          <Button variant="subtle" onClick={() => void progress.refetch()}>
            <FormattedMessage id="issuance.refresh" />
          </Button>
        </Alert>
      )}
    </Stack>
  );
}
