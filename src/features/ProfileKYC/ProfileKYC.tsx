'use client';
import { useRef, useState } from 'react';
import Link from 'next/link';
import { useIsMutating } from '@tanstack/react-query';
import { Alert, Button, Loader, Modal, Stack, Text, Title } from '@mantine/core';
import { FormattedMessage, useIntl } from 'react-intl';
import { useVerification } from './lib/hooks/useVerification';
import { KYCContactsForm } from './components/KYCContactsForm';
import { KYCStatus } from './components/KYCStatus';
export function ProfileKYC({ cardTypeId }: { cardTypeId?: string }) {
  const intl = useIntl();
  const { query, start, active, identityReady, canVerify, verify } = useVerification(cardTypeId);
  const [opened, setOpened] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const saving = useIsMutating({ mutationKey: ['kyc', 'contacts'] }) > 0;
  return (
    <Stack gap="md">
      <Title ref={heading} tabIndex={-1} order={2} size="h3">
        <FormattedMessage id="kyc.title" />
      </Title>
      {query.isPending ? (
        <Loader size="sm" aria-label={intl.formatMessage({ id: 'kyc.loading' })} />
      ) : query.isError ? (
        <Alert color="red" role="alert">
          <Stack gap="sm">
            <FormattedMessage id="kyc.loadError" />
            <Button variant="default" onClick={() => void query.refetch()}>
              <FormattedMessage id="kyc.retry" />
            </Button>
          </Stack>
        </Alert>
      ) : (
        <>
          <KYCStatus state={query.data} />
          {!identityReady && (
            <Text size="sm" c="dimmed">
              <FormattedMessage id={active ? 'kyc.pendingHelp' : 'kyc.help'} />
            </Text>
          )}
          {!query.data.contactsComplete && (
            <Button ref={trigger} variant="default" onClick={() => setOpened(true)}>
              <FormattedMessage id="kyc.addContacts" />
            </Button>
          )}
          {canVerify && (
            <Button onClick={verify} loading={start.isPending} disabled={query.isFetching || saving}>
              <FormattedMessage id={active ? 'kyc.continue' : 'kyc.start'} />
            </Button>
          )}
          {!cardTypeId && !canVerify && (
            <Button component={Link} href="/cabinet/issue" variant="default">
              <FormattedMessage id="kyc.chooseCard" />
            </Button>
          )}
          {cardTypeId && identityReady && !query.data.contactsComplete && (
            <Text size="sm">
              <FormattedMessage id="kyc.finishContacts" />
            </Text>
          )}
          {start.isError && (
            <Alert color="red" role="alert">
              <FormattedMessage id="kyc.startError" />
            </Alert>
          )}
          <Button variant="subtle" onClick={() => void query.refetch()} loading={query.isFetching}>
            <FormattedMessage id="kyc.refresh" />
          </Button>
        </>
      )}
      <Modal
        opened={opened}
        onClose={() => {
          if (!saving) setOpened(false);
        }}
        title={intl.formatMessage({ id: 'kyc.modalTitle' })}
        centered
        size="md"
        closeOnEscape={!saving}
        closeOnClickOutside={!saving}
        closeButtonProps={{
          disabled: saving,
          'aria-label': intl.formatMessage({ id: 'preview.dialog.close' }),
        }}
        returnFocus={false}
        onExitTransitionEnd={() => (trigger.current ?? heading.current)?.focus()}
      >
        {opened && <KYCContactsForm onSaved={() => setOpened(false)} onCancel={() => setOpened(false)} />}
      </Modal>
    </Stack>
  );
}
