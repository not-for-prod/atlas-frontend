'use client';
import { useRef, useState, type ReactNode } from 'react';
import { Button, Modal, Stack, Text } from '@mantine/core';
import { ActionTile } from '~/shared/ui/ActionTile';
import { FormattedMessage, useIntl } from 'react-intl';
export function DemoAction({
  label,
  variant = 'default',
  tile,
}: {
  label: string;
  variant?: 'default' | 'filled' | 'light';
  tile?: { icon: ReactNode; accent?: boolean; inline?: boolean };
}) {
  const [opened, setOpened] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null);
  const intl = useIntl();
  return (
    <>
      {tile ? (
        <ActionTile
          ref={trigger}
          label={label}
          icon={tile.icon}
          accent={tile.accent}
          inline={tile.inline}
          onSelect={() => setOpened(true)}
        />
      ) : (
        <Button ref={trigger} variant={variant} color="dark" onClick={() => setOpened(true)}>
          <FormattedMessage id={label} />
        </Button>
      )}
      <Modal
        opened={opened}
        returnFocus={false}
        onExitTransitionEnd={() => trigger.current?.focus()}
        onClose={() => setOpened(false)}
        title={intl.formatMessage({ id: label })}
        closeButtonProps={{ 'aria-label': intl.formatMessage({ id: 'preview.dialog.close' }) }}
      >
        <Stack>
          <Text size="sm">
            <FormattedMessage id="preview.dialog.description" />
          </Text>
          <Button color="dark" onClick={() => setOpened(false)}>
            <FormattedMessage id="preview.dialog.close" />
          </Button>
        </Stack>
      </Modal>
    </>
  );
}
