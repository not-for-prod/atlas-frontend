'use client';
import { type ReactNode, useState } from 'react';
import { useRouter } from 'next/navigation';
import { IconChevronRight, IconAlertCircle, IconCopy, IconCheck } from '@tabler/icons-react';
import {
  Button,
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
import { PaymentMethodRow } from '~/shared/ui/PaymentMethodRow';
import { ActionTile } from '~/shared/ui/ActionTile';
import { FormattedMessage, useIntl } from 'react-intl';
import { useCryptoAddress, PaymentRequestError, UsdtTronIcon } from '~/entities/payment';
export function CryptoDeposit({ onClose, preview }: { onClose: () => void; preview?: ReactNode }) {
  const intl = useIntl();
  const router = useRouter();
  const [key, setKey] = useState<string>();
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
  function request() {
    const requestKey = key ?? crypto.randomUUID();
    setKey(requestKey);
    deposit.mutate(requestKey);
  }
  return (
    <PaymentMethodRow
      icon={<UsdtTronIcon size={32} />}
      title={<FormattedMessage id="cabinet.deposit.crypto" />}
      description={<FormattedMessage id="crypto.methodNote" />}
      onSelect={deposit.isSuccess ? undefined : signIn ? () => router.push('/account') : request}
      selectionLabel={
        intl.formatMessage({ id: 'cabinet.deposit.crypto' }) +
        ' — ' +
        intl.formatMessage({
          id: signIn
            ? 'auth.signIn'
            : deposit.isError && !unknown
              ? 'crypto.retry'
              : key
                ? 'crypto.check'
                : 'crypto.generate',
        })
      }
      loading={deposit.isPending}
      action={
        !deposit.isSuccess &&
        (deposit.isPending ? (
          <Loader size="sm" color="dark" />
        ) : (
          <IconChevronRight size={22} aria-hidden="true" />
        ))
      }
    >
      {preview}
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
    </PaymentMethodRow>
  );
}
