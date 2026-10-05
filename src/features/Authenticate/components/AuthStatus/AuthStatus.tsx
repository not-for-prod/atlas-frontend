import { Button, Stack, Text, ThemeIcon } from '@mantine/core';
import { IconCheck } from '@tabler/icons-react';
import { FormattedMessage } from 'react-intl';
export function AuthStatus({
  initializing,
  pending,
  onLogout,
}: {
  initializing?: boolean;
  pending: boolean;
  onLogout: () => void;
}) {
  return (
    <Stack gap="lg" align="center">
      <ThemeIcon color="lime" variant="light" size={56} radius="xl">
        <IconCheck aria-hidden size={28} />
      </ThemeIcon>
      <Text fw={700} size="lg" role="status">
        <FormattedMessage id={initializing ? 'auth.initializing' : 'auth.success'} />
      </Text>
      <Text c="dimmed" ta="center">
        <FormattedMessage id={initializing ? 'auth.initializing.help' : 'auth.success.help'} />
      </Text>
      <Button variant="default" onClick={onLogout} loading={pending}>
        <FormattedMessage id="auth.logout" />
      </Button>
      <Text size="xs" c="dimmed" ta="center">
        <FormattedMessage id="auth.logout.help" />
      </Text>
    </Stack>
  );
}
