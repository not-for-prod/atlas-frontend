'use client';
import { useState } from 'react';
import { Alert, Button, Group, Modal, Stack, Text } from '@mantine/core';
import { FormattedMessage, useIntl } from 'react-intl';
import { useDeleteAccount } from './lib/hooks/useDeleteAccount';
export function DeleteAccount() {
  const [opened, setOpened] = useState(false);
  const intl = useIntl();
  const deletion = useDeleteAccount();
  return (
    <>
      <Button color="red" variant="light" onClick={() => setOpened(true)}>
        <FormattedMessage id="cabinet.profile.delete" />
      </Button>
      <Modal
        opened={opened}
        onClose={() => setOpened(false)}
        title={intl.formatMessage({ id: 'auth.delete.title' })}
        centered
      >
        <Stack>
          <Text>
            <FormattedMessage id="auth.delete.confirm" />
          </Text>
          {deletion.isError && (
            <Alert color="red">
              <FormattedMessage id="auth.error.unavailable" />
            </Alert>
          )}
          <Group grow>
            <Button variant="default" onClick={() => setOpened(false)} disabled={deletion.isPending}>
              <FormattedMessage id="auth.delete.cancel" />
            </Button>
            <Button color="red" loading={deletion.isPending} onClick={() => deletion.mutate()}>
              <FormattedMessage id="auth.delete.continue" />
            </Button>
          </Group>
        </Stack>
      </Modal>
    </>
  );
}
