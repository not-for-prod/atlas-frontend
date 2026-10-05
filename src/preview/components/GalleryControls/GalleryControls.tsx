import { Button, Group, Paper, PinInput, Stack, Text, TextInput, Title } from '@mantine/core';
import { FormattedMessage, useIntl } from 'react-intl';
export function GalleryControls({ onConfirm }: { onConfirm: () => void }) {
  const intl = useIntl();
  return (
    <Paper>
      <Stack>
        <Title order={2} size="xl">
          <FormattedMessage id="gallery.controls" />
        </Title>
        <Group>
          <Button>
            <FormattedMessage id="gallery.continue" />
          </Button>
          <Button color="dark">
            <FormattedMessage id="gallery.secondary" />
          </Button>
          <Button disabled>
            <FormattedMessage id="gallery.disabled" />
          </Button>
        </Group>
        <TextInput
          label={intl.formatMessage({ id: 'gallery.email' })}
          type="email"
          placeholder="you@example.com"
          maw={380}
        />
        <Text size="sm" id="code-label">
          <FormattedMessage id="gallery.code" />
        </Text>
        <PinInput ariaLabel={intl.formatMessage({ id: 'gallery.code' })} length={6} type="number" />
        <Button variant="outline" color="dark" onClick={onConfirm} maw={280}>
          <FormattedMessage id="gallery.confirm" />
        </Button>
      </Stack>
    </Paper>
  );
}
