'use client';
import { Alert, Button, Group, Loader, Stack, Text } from '@mantine/core';
import { useState } from 'react';
import { FormattedMessage } from 'react-intl';
import { type AuthIntent } from '~/entities/auth';
import { useAuthentication } from './lib';
import { CodeForm, MethodChoices, AuthStatus } from './components';
import styles from './Authenticate.module.css';
export function Authenticate({
  tariff,
  callbackError,
  deleting = false,
}: {
  tariff?: string;
  callbackError?: 'callback' | 'account_not_found';
  deleting?: boolean;
}) {
  const auth = useAuthentication(tariff, deleting);
  const [callbackDismissed, setCallbackDismissed] = useState(false);
  const selectIntent = (intent: AuthIntent) =>
    auth.act(
      { kind: 'intent', intent },
      {
        onSuccess: () => {
          setCallbackDismissed(true);
          const url = new URL(window.location.href);
          url.searchParams.delete('authError');
          window.history.replaceState(null, '', url.pathname + url.search);
        },
      },
    );
  const transaction = auth.progress?.transaction;
  const pending = transaction?.pendingAttempt;
  return (
    <Stack gap="lg">
      {auth.error && (
        <Alert color="red" role="alert" p="lg">
          <Stack gap="md">
            <FormattedMessage
              id={`auth.error.${auth.error}`}
              defaultMessage="Не удалось продолжить. Попробуйте позже."
            />
            {auth.error === 'account_not_found' &&
              auth.intents.some((item) => item.intent === 'INTENT_SIGN_UP') && (
                <Button
                  variant="light"
                  color="dark"
                  disabled={auth.pending || auth.loading}
                  onClick={() => selectIntent('INTENT_SIGN_UP')}
                >
                  <FormattedMessage id="auth.goToSignUp" />
                </Button>
              )}
            {auth.retryAfter > 0 && (
              <Text size="sm">
                <FormattedMessage id="auth.retryAfter" values={{ seconds: auth.retryAfter }} />
              </Text>
            )}
            <Group justify="center">
              <Button variant="default" onClick={auth.retry} disabled={auth.pending}>
                <FormattedMessage id="auth.retry" />
              </Button>
            </Group>
          </Stack>
        </Alert>
      )}
      {callbackError && !callbackDismissed && !auth.progress?.authenticated && (
        <Alert color="red" role="alert">
          <Stack gap="sm">
            <FormattedMessage id={`auth.error.${callbackError}`} />
            {callbackError === 'account_not_found' &&
              auth.intents.some((item) => item.intent === 'INTENT_SIGN_UP') && (
                <Button
                  variant="light"
                  color="dark"
                  disabled={auth.pending || auth.loading}
                  onClick={() => selectIntent('INTENT_SIGN_UP')}
                >
                  <FormattedMessage id="auth.goToSignUp" />
                </Button>
              )}
          </Stack>
        </Alert>
      )}
      {auth.loading ? (
        <Group role="status">
          <Loader size="sm" />
          <Text>
            <FormattedMessage id="auth.loading" />
          </Text>
        </Group>
      ) : auth.progress?.authenticated ? (
        <AuthStatus
          initializing={auth.progress.initializing}
          pending={auth.pending}
          onLogout={() => auth.act({ kind: 'logout' })}
        />
      ) : auth.policy.data && auth.session.data ? (
        <>
          {!deleting && (
            <Group grow gap={4} className={styles.intents}>
              {auth.intents.map((item) => (
                <Button
                  key={item.intent}
                  variant="subtle"
                  className={styles.intent}
                  color="dark"
                  disabled={auth.pending}
                  aria-pressed={item.intent === auth.activeIntent}
                  onClick={() => selectIntent(item.intent as AuthIntent)}
                >
                  <FormattedMessage id={item.intent === 'INTENT_SIGN_IN' ? 'auth.signIn' : 'auth.signUp'} />
                </Button>
              ))}
            </Group>
          )}
          {auth.unsupported && (
            <Alert color="yellow">
              <FormattedMessage id="auth.unsupported" />
            </Alert>
          )}
          {transaction?.status === 'active' &&
          pending?.ready &&
          pending.selection?.methodId === 'email_code' ? (
            <CodeForm
              pending={auth.pending}
              onSubmit={(code) => auth.act({ kind: 'verify', code })}
              onRestart={() => auth.act({ kind: 'restart' })}
            />
          ) : transaction && (transaction.status !== 'active' || pending) ? (
            <Stack>
              <Text>
                <FormattedMessage id="auth.flowPending" />
              </Text>
              <Button
                variant="default"
                onClick={() =>
                  auth.act(
                    deleting && transaction.status === 'finalizing'
                      ? { kind: 'retryDeletion' }
                      : { kind: 'restart' },
                  )
                }
                disabled={auth.pending}
              >
                <FormattedMessage
                  id={deleting && transaction.status === 'finalizing' ? 'auth.retry' : 'auth.restart'}
                />
              </Button>
            </Stack>
          ) : (
            <>
              {transaction && (
                <Text size="sm" c="dimmed">
                  <FormattedMessage id="auth.nextStep" />
                </Text>
              )}
              <MethodChoices
                choices={auth.choices}
                pending={auth.pending}
                onStart={(selection, email) => auth.act({ kind: 'start', selection, email })}
              />
              {transaction && (
                <Button
                  variant="subtle"
                  color="dark"
                  onClick={() => auth.act({ kind: 'restart' })}
                  disabled={auth.pending}
                >
                  <FormattedMessage id="auth.restart" />
                </Button>
              )}
            </>
          )}
        </>
      ) : null}
    </Stack>
  );
}
