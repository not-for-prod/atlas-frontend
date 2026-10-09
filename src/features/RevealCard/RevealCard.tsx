import { ActionIcon, Button, Group, Text } from '@mantine/core';
import { IconEyeOff, IconLock } from '@tabler/icons-react';
import { FormattedMessage, useIntl } from 'react-intl';
import { useCardRequisites } from './lib/hooks/useCardRequisites';
import { RequisiteField } from './components/RequisiteField';
import { BillingAddressFields } from './components/BillingAddressFields';
import styles from './RevealCard.module.css';

export function RevealCard({ cardId, onHide }: { cardId: string; onHide?: () => void }) {
  const { requisites, access, isPending, isError, retry } = useCardRequisites(cardId);
  const intl = useIntl();
  const number = requisites?.number;
  const formattedNumber = number && /^\d+$/.test(number) ? number.match(/.{1,4}/g)?.join(' ') : number;
  const month = requisites?.expirationMonth;
  const year = requisites?.expirationYear;
  const expiry =
    month || year ? `${month || '—'}/${year?.replace(/^\d{2}(\d{2})$/, '$1') || '—'}` : undefined;
  const address = requisites?.billingAddress;
  return (
    <div className={styles.container}>
      <div className={styles.requisites}>
        <div className={styles.brand}>
          <FormattedMessage id="brand" />
          <b>.</b>
        </div>
        <Group className={styles.toolbar} gap={0} wrap="nowrap">
          {onHide && (
            <ActionIcon
              variant="transparent"
              color="white"
              size={40}
              radius="xl"
              aria-label={intl.formatMessage({ id: 'cabinet.card.hideDetails' })}
              title={intl.formatMessage({ id: 'cabinet.card.hideDetails' })}
              onClick={onHide}
              autoFocus
            >
              <IconEyeOff size={20} aria-hidden="true" />
            </ActionIcon>
          )}
        </Group>
        <div className={styles.stripe} aria-hidden="true" />
        {isPending ? (
          <Text className={styles.message} role="status">
            <FormattedMessage id="cabinet.card.requisitesLoading" />
          </Text>
        ) : isError ? (
          <div className={styles.message}>
            <Text size="inherit" role="alert">
              <FormattedMessage id="cabinet.card.requisitesError" />
            </Text>
            <Button variant="transparent" color="white" size="compact-xs" onClick={retry}>
              <FormattedMessage id="cabinet.card.requisitesRetry" />
            </Button>
          </div>
        ) : access === 'topup-required' ? (
          <div className={styles.message} role="status">
            <Group gap={6} wrap="nowrap">
              <IconLock size={16} aria-hidden="true" />
              <Text className={styles.lockedTitle}>
                <FormattedMessage id="cabinet.card.topupToReveal" />
              </Text>
            </Group>
            <Text className={styles.lockedCopy}>
              <FormattedMessage id="cabinet.card.topupToRevealHint" />
            </Text>
          </div>
        ) : access === 'balance-unavailable' ? (
          <div className={styles.message}>
            <Text size="inherit" role="status">
              <FormattedMessage id="cabinet.card.requisitesBalanceUnavailable" />
            </Text>
            <Button variant="transparent" color="white" size="compact-xs" onClick={retry}>
              <FormattedMessage id="cabinet.card.requisitesRetry" />
            </Button>
          </div>
        ) : requisites && Object.values(requisites).some(Boolean) ? (
          <>
            <div className={styles.number}>
              <RequisiteField
                label="cabinet.card.number"
                copyLabel="cabinet.card.copyNumber"
                value={formattedNumber}
                copyValue={number?.replace(/\s/g, '')}
                prominent
              />
            </div>
            <div className={styles.details}>
              {requisites.holderName && (
                <RequisiteField
                  label="cabinet.card.holder"
                  copyLabel="cabinet.card.copyHolder"
                  value={requisites.holderName}
                />
              )}
              <div className={styles.expiry}>
                <RequisiteField
                  label="cabinet.card.expiryShort"
                  copyLabel="cabinet.card.copyExpiry"
                  value={expiry}
                  copyValue={month && year ? expiry : ''}
                />
              </div>
              <div className={styles.cvv}>
                <RequisiteField
                  label="cabinet.card.cvv"
                  copyLabel="cabinet.card.copyCvv"
                  value={requisites.securityCode}
                />
              </div>
            </div>
          </>
        ) : (
          <div className={styles.message}>
            <Text size="inherit" role="status">
              <FormattedMessage id="cabinet.card.secretsUnavailable" />
            </Text>
            <Button variant="transparent" color="white" size="compact-xs" onClick={retry}>
              <FormattedMessage id="cabinet.card.requisitesRetry" />
            </Button>
          </div>
        )}
      </div>
      {address && Object.values(address).some(Boolean) && <BillingAddressFields address={address} />}
    </div>
  );
}
