'use client';
import { Alert, Button, Image, Stack, Switch, Text } from '@mantine/core';
import { useSearchParams } from 'next/navigation';
import { FormattedMessage, useIntl } from 'react-intl';
import {
  useConnectTelegram,
  useNotificationSettings,
  useSetNotificationsEnabled,
} from '~/entities/notification';
import { StatePanel } from '~/shared/ui/StatePanel';
export function NotificationSettings() {
  const intl = useIntl();
  const params = useSearchParams();
  const settings = useNotificationSettings();
  const save = useSetNotificationsEnabled();
  const connect = useConnectTelegram();
  if (settings.isPending) return <StatePanel state="loading" />;
  if (settings.isError) return <StatePanel state="error" onRetry={() => void settings.refetch()} />;
  return (
    <Stack gap="md">
      <Switch
        checked={!!settings.data.enabled}
        disabled={save.isPending}
        color="dark"
        onChange={(event) => save.mutate(event.currentTarget.checked)}
        label={intl.formatMessage({ id: 'cabinet.profile.events' })}
      />
      <Text size="sm" c="dimmed">
        <FormattedMessage
          id={settings.data.telegramConnected ? 'notification.connected' : 'notification.disconnected'}
        />
      </Text>
      <Button
        color="dark"
        loading={connect.isPending}
        disabled={!settings.data.connectionAvailable}
        leftSection={<Image src="/brands/telegram.svg" alt="" w={22} h={22} />}
        onClick={() => connect.mutate()}
      >
        <FormattedMessage
          id={settings.data.telegramConnected ? 'notification.reconnect' : 'notification.connect'}
        />
      </Button>
      {!settings.data.connectionAvailable && (
        <Text size="xs" c="dimmed">
          <FormattedMessage id="notification.unavailable" />
        </Text>
      )}
      {params.get('notificationConnection') === 'connected' && (
        <Text role="status">
          <FormattedMessage id="notification.connected" />
        </Text>
      )}
      {(save.isError || connect.isError || params.get('notificationConnection') === 'error') && (
        <Alert color="red" role="alert">
          <FormattedMessage id={save.isError ? 'notification.saveError' : 'notification.connectionError'} />
        </Alert>
      )}
    </Stack>
  );
}
