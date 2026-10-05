import { Button, Loader, Stack, Text, Title } from '@mantine/core';
import { IconArrowUpRight, IconAlertCircle, IconCreditCard } from '@tabler/icons-react';
import { FormattedMessage } from 'react-intl';
import styles from './StatePanel.module.css';
export type PanelState = 'empty' | 'loading' | 'provisioning' | 'error';
export function StatePanel({
  state,
  onRetry,
  titleId,
  descriptionId,
}: {
  state: PanelState;
  onRetry?: () => void;
  titleId?: string;
  descriptionId?: string;
}) {
  return (
    <section className={styles.panel} role={state === 'error' ? 'alert' : 'status'}>
      <Stack align="center" gap="md">
        {state === 'loading' || state === 'provisioning' ? (
          <Loader color="dark" size="sm" />
        ) : state === 'error' ? (
          <IconAlertCircle size={30} />
        ) : (
          <IconCreditCard size={30} />
        )}
        <Title order={3} size="lg">
          <FormattedMessage id={titleId || `state.${state}.title`} />
        </Title>
        <Text size="sm" c="dimmed" maw={330}>
          <FormattedMessage id={descriptionId || `state.${state}.description`} />
        </Text>
        {state === 'error' && onRetry && (
          <Button color="dark" onClick={onRetry} rightSection={<IconArrowUpRight size={16} />}>
            <FormattedMessage id="state.retry" />
          </Button>
        )}
      </Stack>
    </section>
  );
}
