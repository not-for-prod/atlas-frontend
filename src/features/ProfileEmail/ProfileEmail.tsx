'use client';
import { Alert, Button, Modal, Stack, Text, Title } from '@mantine/core';
import { IconCircleCheck, IconMail } from '@tabler/icons-react';
import { FormattedMessage, useIntl } from 'react-intl';
import { StatePanel } from '~/shared/ui/StatePanel';
import { EmailForm } from '~/shared/ui/EmailForm';
import { CodeForm } from '~/shared/ui/CodeForm';
import styles from './ProfileEmail.module.css';
import { useEmailVerification } from './lib/hooks/useEmailVerification';
export function ProfileEmail() {
  const intl = useIntl();
  const flow = useEmailVerification();
  return (
    <Stack gap="md">
      <div className={styles.summary}>
        <div className={styles.icon} aria-hidden="true">
          <IconMail size={20} stroke={1.6} />
        </div>
        <Stack gap={4} className={styles.details}>
          <Title order={2} className={styles.label}>
            <FormattedMessage id="profile.email.title" />
          </Title>
          {flow.query.isPending ? (
            <StatePanel state="loading" />
          ) : flow.query.isError ? (
            <StatePanel state="error" onRetry={() => void flow.query.refetch()} />
          ) : flow.query.data.verified ? (
            <Text className={styles.email}>{flow.query.data.email}</Text>
          ) : (
            <Text size="sm" c="dimmed">
              <FormattedMessage id="profile.email.absent" />
            </Text>
          )}
        </Stack>
        {!flow.query.isPending &&
          !flow.query.isError &&
          (flow.query.data.verified ? (
            <Text component="span" className={styles.status}>
              <IconCircleCheck size={16} stroke={1.8} aria-hidden="true" />
              <FormattedMessage id="profile.email.verified" />
            </Text>
          ) : (
            <Button color="dark" className={styles.action} onClick={flow.open}>
              <FormattedMessage id="profile.email.add" />
            </Button>
          ))}
      </div>
      <Modal
        opened={flow.opened}
        onClose={flow.close}
        title={intl.formatMessage({ id: 'profile.email.title' })}
        centered
        closeOnEscape={!flow.pending}
        closeOnClickOutside={!flow.pending}
        withCloseButton={!flow.pending}
      >
        <Stack gap="md">
          {flow.error && (
            <Alert color="red" role="alert">
              <FormattedMessage
                id={`auth.error.${flow.error}`}
                defaultMessage="Не удалось подтвердить email. Попробуйте ещё раз."
              />
            </Alert>
          )}
          {flow.link ? (
            <>
              <Text size="sm">
                <FormattedMessage id="profile.email.sent" values={{ email: flow.email }} />
              </Text>
              {flow.expired ? (
                <>
                  <Text role="status">
                    <FormattedMessage id="profile.email.expired" />
                  </Text>
                  <Button color="dark" onClick={flow.restart}>
                    <FormattedMessage id="auth.restart" />
                  </Button>
                </>
              ) : (
                <CodeForm pending={flow.pending} onSubmit={flow.verifyCode} onRestart={flow.restart} />
              )}
              <Button
                variant="subtle"
                color="dark"
                disabled={flow.pending || flow.retryAfter > 0}
                onClick={() => flow.send(flow.email)}
              >
                <FormattedMessage id="profile.email.resend" />
              </Button>
            </>
          ) : (
            <EmailForm pending={flow.pending || flow.retryAfter > 0} onSubmit={flow.send} />
          )}
          {flow.retryAfter > 0 && (
            <Text size="sm" role="status">
              <FormattedMessage id="auth.retryAfter" values={{ seconds: flow.retryAfter }} />
            </Text>
          )}
        </Stack>
      </Modal>
    </Stack>
  );
}
