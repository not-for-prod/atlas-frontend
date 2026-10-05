'use client';
import { useState } from 'react';
import { Button, Group, Modal, SimpleGrid, Stack, Text, Title } from '@mantine/core';
import { FormattedMessage, useIntl } from 'react-intl';
import { PreviewShell } from '~/widgets/PreviewShell';
import { CardVisual } from '~/entities/card';
import { Balance } from '~/entities/client-asset';
import { StatePanel } from '~/shared/ui/StatePanel';
import { GalleryControls, GalleryStatuses } from './components';
export function PreviewGallery() {
  const [opened, setOpened] = useState(false);
  const intl = useIntl();
  return (
    <PreviewShell active="gallery">
      <Stack gap="xl">
        <div>
          <Title order={1}>
            <FormattedMessage id="gallery.title" />
          </Title>
          <Text c="dimmed" mt="sm">
            <FormattedMessage id="gallery.description" />
          </Text>
        </div>
        <GalleryControls onConfirm={() => setOpened(true)} />
        <GalleryStatuses />
        <Title order={2} size="xl">
          <FormattedMessage id="gallery.cards" />
        </Title>
        <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="xl">
          <CardVisual />
          <Balance availableAmount="1250.50" reservedAmount="25" />
        </SimpleGrid>
        <Title order={2} size="xl">
          <FormattedMessage id="gallery.states" />
        </Title>
        <SimpleGrid cols={{ base: 1, sm: 2 }}>
          {(['empty', 'loading', 'provisioning', 'error'] as const).map((state) => (
            <StatePanel key={state} state={state} />
          ))}
        </SimpleGrid>
      </Stack>
      <Modal
        closeButtonProps={{ 'aria-label': intl.formatMessage({ id: 'preview.dialog.close' }) }}
        opened={opened}
        onClose={() => setOpened(false)}
        title={intl.formatMessage({ id: 'gallery.confirmTitle' })}
      >
        <Stack>
          <Text>
            <FormattedMessage id="gallery.confirmText" />
          </Text>
          <Group justify="flex-end">
            <Button variant="subtle" color="dark" onClick={() => setOpened(false)}>
              <FormattedMessage id="gallery.cancel" />
            </Button>
            <Button onClick={() => setOpened(false)}>
              <FormattedMessage id="gallery.accept" />
            </Button>
          </Group>
        </Stack>
      </Modal>
    </PreviewShell>
  );
}
