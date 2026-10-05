'use client';
import { Button, Stack, Text } from '@mantine/core';
import Image from 'next/image';
import { FormattedMessage } from 'react-intl';
import { useSupport } from '~/entities/support';
export function TelegramSupport() {
  const { data: supportUrl, isPending } = useSupport();
  return (
    <Stack gap="sm">
      {supportUrl ? (
        <Button
          component="a"
          href={supportUrl}
          target="_blank"
          rel="noopener noreferrer"
          variant="default"
          leftSection={<Image src="/brands/telegram.svg" loading="eager" alt="" width={22} height={22} />}
        >
          <FormattedMessage id="cabinet.telegram" />
        </Button>
      ) : (
        <>
          <Button
            disabled
            loading={isPending}
            variant="default"
            leftSection={<Image src="/brands/telegram.svg" loading="eager" alt="" width={22} height={22} />}
          >
            <FormattedMessage id="cabinet.telegram" />
          </Button>
          <Text size="sm" c="dimmed">
            <FormattedMessage id="cabinet.telegram.unavailable" />
          </Text>
        </>
      )}
    </Stack>
  );
}
