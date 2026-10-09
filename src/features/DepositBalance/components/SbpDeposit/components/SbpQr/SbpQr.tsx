import { useEffect, useState } from 'react';
import { Button, Group, Loader, Stack, Text } from '@mantine/core';
import { QRCodeSVG } from 'qrcode.react';
import { FormattedMessage, useIntl } from 'react-intl';
import { useSbpPaymentQr } from '~/entities/payment';
import classes from './SbpQr.module.css';
export function SbpQr({ paymentId }: { paymentId: string }) {
  const intl = useIntl();
  const query = useSbpPaymentQr(paymentId);
  const [clock, setClock] = useState(() => Date.now());
  const expiresAt = query.data?.expiresAt;
  useEffect(() => {
    if (!expiresAt) return;
    const timer = setTimeout(() => setClock(Date.now()), Math.max(0, Date.parse(expiresAt) - Date.now()));
    return () => clearTimeout(timer);
  }, [expiresAt]);
  const available = query.data?.status === 'SBP_QR_STATUS_AVAILABLE' && Date.parse(expiresAt ?? '') > clock;
  if (available)
    return (
      <Stack align="center" gap="sm">
        <QRCodeSVG
          className={classes.qr}
          value={query.data!.url!}
          size={200}
          level="M"
          marginSize={4}
          role="img"
          aria-label={intl.formatMessage({ id: 'sbp.qrLabel' })}
        />
        <Button
          component="a"
          href={query.data!.url}
          target="_blank"
          rel="noopener noreferrer"
          referrerPolicy="no-referrer"
        >
          <FormattedMessage id="sbp.openBank" />
        </Button>
      </Stack>
    );
  return (
    <Group role="status">
      {(query.isPending || query.data?.status === 'SBP_QR_STATUS_PENDING') && <Loader size="sm" />}
      <Text size="sm" c="dimmed">
        <FormattedMessage
          id={
            query.isError
              ? 'sbp.qrUnavailable'
              : query.isPending || query.data?.status === 'SBP_QR_STATUS_PENDING'
                ? 'sbp.qrPreparing'
                : query.data?.status === 'SBP_QR_STATUS_EXPIRED' ||
                    query.data?.status === 'SBP_QR_STATUS_AVAILABLE'
                  ? 'sbp.qrExpired'
                  : 'sbp.qrCheckout'
          }
        />
      </Text>
    </Group>
  );
}
