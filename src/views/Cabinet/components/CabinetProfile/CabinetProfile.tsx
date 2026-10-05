'use client';
import { SimpleGrid, Stack, Text, Title } from '@mantine/core';
import { FormattedMessage } from 'react-intl';
import { NotificationSettings } from '~/features/NotificationSettings';
import { ProfileKYC } from '~/features/ProfileKYC';
import { DemoAction } from '~/features/DemoAction';
import { TelegramSupport } from '~/features/TelegramSupport';
import { DeleteAccount } from '~/features/DeleteAccount';
import { Logout } from '~/features/Logout';
import styles from '../../Cabinet.module.css';
export function CabinetProfile() {
  return (
    <Stack gap="lg">
      <Stack className={styles.panel}>
        <ProfileKYC />
      </Stack>
      <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="lg">
        <Stack className={styles.panel}>
          <Title order={2} size="h3">
            <FormattedMessage id="cabinet.profile.account" />
          </Title>
          <Text size="sm" c="dimmed">
            <FormattedMessage id="cabinet.profile.example" />
          </Text>
          <DemoAction label="cabinet.profile.methods" />
          <DeleteAccount />
          <TelegramSupport />
        </Stack>
        <Stack className={styles.panel}>
          <Title order={2} size="h3">
            <FormattedMessage id="cabinet.profile.notifications" />
          </Title>
          <NotificationSettings />
          <Logout />
          <Text size="xs" c="dimmed">
            <FormattedMessage id="auth.logout.help" />
          </Text>
        </Stack>
      </SimpleGrid>
    </Stack>
  );
}
