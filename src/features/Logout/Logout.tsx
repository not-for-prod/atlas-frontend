'use client';
import { Alert, Button, Menu, Stack } from '@mantine/core';
import { IconLogout } from '@tabler/icons-react';
import { FormattedMessage } from 'react-intl';
import { useLogout } from './lib/hooks/useLogout';
export function Logout({ variant = 'button' }: { variant?: 'button' | 'menu' }) {
  const logout = useLogout();
  const error = logout.isError && (
    <Alert color="red">
      <FormattedMessage id="auth.error.unavailable" />
    </Alert>
  );
  if (variant === 'menu')
    return (
      <>
        {error}
        <Menu.Item
          color="red"
          c="red.8"
          leftSection={<IconLogout size={18} />}
          disabled={logout.isPending}
          closeMenuOnClick={false}
          onClick={() => logout.mutate()}
        >
          <FormattedMessage id="auth.logout" />
        </Menu.Item>
      </>
    );
  return (
    <Stack gap="sm">
      {error}
      <Button variant="default" loading={logout.isPending} onClick={() => logout.mutate()}>
        <FormattedMessage id="auth.logout" />
      </Button>
    </Stack>
  );
}
