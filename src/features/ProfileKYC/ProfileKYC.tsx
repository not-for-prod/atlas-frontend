'use client';
import { useRef, useState } from 'react';
import { useIsMutating } from '@tanstack/react-query';
import { Alert, Badge, Button, Group, Loader, Modal, Stack, Text, Title } from '@mantine/core';
import { FormattedMessage, useIntl } from 'react-intl';
import { useKYC } from '~/entities/kyc';
import { KYCForm } from './components/KYCForm';
export function ProfileKYC() {
  const intl = useIntl();
  const query = useKYC();
  const [opened, setOpened] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const saving = useIsMutating({ mutationKey: ['kyc'] }) > 0;
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
          <Group>
            <Text size="sm">
              <FormattedMessage id="kyc.level" />
            </Text>
            <Badge color={query.data.level === 'KYC_LEVEL_VERIFIED' ? 'green' : 'gray'} variant="light">
              <FormattedMessage
                id={query.data.level === 'KYC_LEVEL_VERIFIED' ? 'kyc.verified' : 'kyc.unverified'}
              />
            </Badge>
          </Group>
          {submitted ? (
            <Text role="status" size="sm" c="dimmed">
              <FormattedMessage id="kyc.collected" />
            </Text>
          ) : query.data.level === 'KYC_LEVEL_UNVERIFIED' ? (
            <Button ref={trigger} variant="default" onClick={() => setOpened(true)}>
              <FormattedMessage id="kyc.start" />
            </Button>
          ) : null}
        </>
      )}
      <Modal
        opened={opened}
        onClose={() => {
          if (!saving) setOpened(false);
        }}
        title={intl.formatMessage({ id: 'kyc.modalTitle' })}
        size="lg"
        centered
        closeOnEscape={!saving}
        closeOnClickOutside={!saving}
        closeButtonProps={{
          disabled: saving,
          'aria-label': intl.formatMessage({ id: 'preview.dialog.close' }),
        }}
        returnFocus={false}
        onExitTransitionEnd={() => (trigger.current ?? heading.current)?.focus()}
      >
        {opened && (
          <Stack>
            <Text size="sm" c="dimmed">
              <FormattedMessage id="kyc.help" />
            </Text>
            <KYCForm
              onSaved={() => {
                setSubmitted(true);
                setOpened(false);
              }}
              onCancel={() => setOpened(false)}
            />
          </Stack>
        )}
      </Modal>
    </Stack>
  );
}
