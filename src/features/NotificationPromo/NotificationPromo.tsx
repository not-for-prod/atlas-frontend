'use client';
import Link from 'next/link';
import { ActionIcon, Box, Stack, Text } from '@mantine/core';
import { IconX } from '@tabler/icons-react';
import { FormattedMessage, useIntl } from 'react-intl';
import { useNotificationSettings, useSetNotificationsEnabled } from '~/entities/notification';
import styles from './NotificationPromo.module.css';
export function NotificationPromo() {
  const intl = useIntl();
  const settings = useNotificationSettings();
  const save = useSetNotificationsEnabled();
  if (!settings.data?.enabled || settings.data.telegramConnected) return null;
  return (
    <Box className={styles.panel}>
      <Link
        href="/cabinet/profile"
        className={styles.link}
        aria-label={intl.formatMessage({ id: 'notification.promo.title' })}
      >
        <Stack gap="sm">
          <Text size="sm" fw={700} c="lime.9">
            <FormattedMessage id="notification.promo.title" />
          </Text>
          <Text size="sm">
            <FormattedMessage id="notification.promo.description" />
          </Text>
          {save.isError && (
            <Text role="alert" size="sm">
              <FormattedMessage id="notification.saveError" />
            </Text>
          )}
        </Stack>
      </Link>
      <ActionIcon
        className={styles.dismiss}
        variant="subtle"
        color="dark"
        aria-label={intl.formatMessage({ id: 'notification.promo.close' })}
        loading={save.isPending}
        onClick={() => save.mutate(false)}
      >
        <IconX size={18} />
      </ActionIcon>
    </Box>
  );
}
