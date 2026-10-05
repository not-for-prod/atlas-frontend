import { Group, Paper, Title } from '@mantine/core';
import { FormattedMessage } from 'react-intl';
import { StatusBadge } from '~/shared/ui/StatusBadge';
export function GalleryStatuses() {
  return (
    <Paper>
      <Title order={2} size="xl" mb="lg">
        <FormattedMessage id="gallery.statuses" />
      </Title>
      <Group>
        {(['success', 'pending', 'reserved', 'failed'] as const).map((status) => (
          <StatusBadge key={status} status={status} />
        ))}
      </Group>
    </Paper>
  );
}
