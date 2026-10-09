'use client';
import { type ReactNode, useCallback, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { IconArrowLeft, IconAlertCircle, IconCopy, IconCheck } from '@tabler/icons-react';
import {
  Button,
  Group,
  Title,
  Stack,
  Text,
  TextInput,
  CopyButton,
  Loader,
  Alert,
  ActionIcon,
  Tooltip,
} from '@mantine/core';
import { QRCodeSVG } from 'qrcode.react';
import styles from './CryptoDeposit.module.css';
import { ActionTile } from '~/shared/ui/ActionTile';
import { FormattedMessage, useIntl } from 'react-intl';
import { useCryptoAddress, PaymentRequestError } from '~/entities/payment';
export function CryptoDeposit({
  onClose,
  onBack,
  preview,
}: {
  onClose: () => void;
  onBack?: () => void;
  preview?: ReactNode;
}) {
  const intl = useIntl();
  const router = useRouter();
  const key = useRef<string>(undefined);
  const heading = useRef<HTMLHeadingElement>(null);
  const deposit = useCryptoAddress();
  const signIn = deposit.error instanceof PaymentRequestError && [401, 403].includes(deposit.error.status);
  const unknown =
    deposit.isError && (!(deposit.error instanceof PaymentRequestError) || deposit.error.code === 9);
  const errorMessage = signIn
    ? 'crypto.signIn'
    : unknown
      ? 'crypto.unknown'
      : deposit.error instanceof PaymentRequestError && deposit.error.status === 503
        ? 'crypto.unavailable'
        : 'crypto.failed';
  const mutate = deposit.mutate;
  const request = useCallback(() => {
    const requestKey = key.current ?? crypto.randomUUID();
    key.current = requestKey;
    mutate(requestKey);
  }, [mutate]);
  useEffect(() => {
    heading.current?.focus();
    if (key.current) return;
    const timer = setTimeout(request, 0);
    return () => clearTimeout(timer);
  }, [request]);
  return (
    <Stack gap="lg">
      <Group justify="space-between">
        <Title ref={heading} tabIndex={-1} order={2} size="h4">
          <FormattedMessage id="cabinet.deposit.crypto" />
        </Title>
        {onBack && (
          <Button variant="subtle" color="dark" leftSection={<IconArrowLeft size={16} />} onClick={onBack}>
            <FormattedMessage id="sbp.back" />
          </Button>
        )}
      </Group>
      {preview}
      {deposit.isPending && (
        <Group role="status">
          <Loader size="sm" color="dark" />
          <Text>
            <FormattedMessage id="crypto.generate" />
          </Text>
        </Group>
      )}
      {deposit.isSuccess && (
        <Stack role="status">
          <QRCodeSVG
            className={styles.qr}
            value={deposit.data.requisite?.address ?? ''}
            size={200}
            level="M"
            marginSize={4}
            role="img"
            aria-label={intl.formatMessage({ id: 'crypto.addressQr' })}
          />
          <CopyButton value={deposit.data.requisite?.address ?? ''}>
            {({ copied, copy }) => (
              <TextInput
                readOnly
                label={intl.formatMessage({ id: 'crypto.address' })}
                value={deposit.data.requisite?.address ?? ''}
                onFocus={(event) => event.currentTarget.select()}
                rightSectionWidth={44}
                rightSectionPointerEvents="all"
                rightSection={
                  <Tooltip label={intl.formatMessage({ id: copied ? 'crypto.copied' : 'crypto.copy' })}>
                    <ActionIcon
                      variant="subtle"
                      color="dark"
                      size={32}
                      onClick={copy}
                      aria-label={intl.formatMessage({ id: copied ? 'crypto.copied' : 'crypto.copy' })}
                    >
                      {copied ? (
                        <IconCheck size={18} aria-hidden="true" />
                      ) : (
                        <IconCopy size={18} aria-hidden="true" />
                      )}
                    </ActionIcon>
                  </Tooltip>
                }
              />
            )}
          </CopyButton>
          <Text size="sm">
            <FormattedMessage id="crypto.network" />
          </Text>
          <ActionTile label="crypto.sent" icon={<IconCheck size={20} />} accent inline onSelect={onClose} />
        </Stack>
      )}
      {deposit.isError && (
        <Alert
          color="red"
          icon={<IconAlertCircle size={20} />}
          title={intl.formatMessage({ id: 'crypto.errorTitle' })}
        >
          <Stack gap="sm">
            <Text size="sm">
              <FormattedMessage id={errorMessage} />
            </Text>
            <Button variant="default" onClick={signIn ? () => router.push('/account') : request}>
              <FormattedMessage id={signIn ? 'auth.signIn' : unknown ? 'crypto.check' : 'crypto.retry'} />
            </Button>
          </Stack>
        </Alert>
      )}
    </Stack>
  );
}
