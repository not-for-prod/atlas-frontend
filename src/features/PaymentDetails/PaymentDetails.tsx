'use client';
import Link from 'next/link';
import { IconRefresh } from '@tabler/icons-react';
import { ActionIcon, Alert, Button, Group, Modal, Stack, Text } from '@mantine/core';
import { FormattedMessage, useIntl } from 'react-intl';
import { PaymentRequestError, usePayment } from '~/entities/payment';
import { StatePanel } from '~/shared/ui/StatePanel';
import { PaymentReceipt } from './components/PaymentReceipt';

export function PaymentDetails({ paymentId, onClose }: { paymentId: string | null; onClose: () => void }) {
  const intl = useIntl();
  const detail = usePayment(paymentId);
  const signIn = detail.error instanceof PaymentRequestError && [401, 403].includes(detail.error.status);
  const missing = detail.error instanceof PaymentRequestError && detail.error.status === 404;
  return (
    <Modal.Root opened={!!paymentId} onClose={onClose} centered size="md" radius="xl" padding="lg">
      <Modal.Overlay />
      <Modal.Content>
        <Modal.Header>
          <Modal.Title>{intl.formatMessage({ id: 'payment.details' })}</Modal.Title>
          <Group gap={4} wrap="nowrap">
            <ActionIcon
              variant="transparent"
              color="dark"
              size={36}
              aria-label={intl.formatMessage({ id: 'crypto.refresh' })}
              loading={detail.isFetching}
              onClick={() => void detail.refetch()}
            >
              <IconRefresh size={20} aria-hidden="true" />
            </ActionIcon>
            <Modal.CloseButton size={36} aria-label={intl.formatMessage({ id: 'preview.dialog.close' })} />
          </Group>
        </Modal.Header>
        <Modal.Body>
          {detail.isPending ? (
            <StatePanel state="loading" />
          ) : signIn ? (
            <Stack>
              <Text>
                <FormattedMessage id="crypto.signIn" />
              </Text>
              <Button component={Link} href="/account" color="dark">
                <FormattedMessage id="auth.signIn" />
              </Button>
            </Stack>
          ) : missing ? (
            <Text role="alert">
              <FormattedMessage id="payment.notFound" />
            </Text>
          ) : detail.isError && !detail.data ? (
            <StatePanel state="error" onRetry={() => void detail.refetch()} />
          ) : (
            <Stack>
              {detail.isError && (
                <Alert color="red">
                  <FormattedMessage id="payment.refreshError" />
                </Alert>
              )}
              {detail.data && <PaymentReceipt payment={detail.data} />}
            </Stack>
          )}
        </Modal.Body>
      </Modal.Content>
    </Modal.Root>
  );
}
