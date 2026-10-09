import { Button, Stack, Text } from '@mantine/core';
import { IconArrowUpRight } from '@tabler/icons-react';
import { FormattedMessage } from 'react-intl';
import { choiceKey, type MethodSelection } from '~/entities/auth';
import { EmailForm } from '../EmailForm';
import { ProviderIcon } from './components/ProviderIcon';
import styles from './MethodChoices.module.css';
export function MethodChoices({
  choices,
  pending,
  onStart,
}: {
  choices: MethodSelection[];
  pending: boolean;
  onStart: (selection: MethodSelection, email?: string) => void;
}) {
  const providers = choices.filter((choice) => choice.methodId !== 'email_code');
  const emailChoices = choices.filter((choice) => choice.methodId === 'email_code');
  return (
    <Stack gap="sm">
      {emailChoices.map((choice) => (
        <EmailForm key={choiceKey(choice)} pending={pending} onSubmit={(email) => onStart(choice, email)} />
      ))}
      {providers.length > 0 && (
        <Stack gap="sm">
          {providers.map((choice) => (
            <Button
              key={choiceKey(choice)}
              variant="default"
              fullWidth
              classNames={{ root: styles.provider, inner: styles.inner, label: styles.label }}
              leftSection={<ProviderIcon provider={choice.providerId} />}
              rightSection={<IconArrowUpRight size={19} stroke={1.7} aria-hidden="true" />}
              disabled={pending}
              onClick={() => onStart(choice)}
            >
              <FormattedMessage id={`auth.provider.${choice.providerId}`} />
            </Button>
          ))}
        </Stack>
      )}
      {emailChoices.length === 0 && providers.length > 0 && (
        <Text className={styles.note}>
          <FormattedMessage id="auth.provider.help" />
        </Text>
      )}
      {choices.length === 0 && (
        <Text c="dimmed">
          <FormattedMessage id="auth.noMethods" />
        </Text>
      )}
    </Stack>
  );
}
