'use client';
import Link from 'next/link';
import { Button, Stack, Text } from '@mantine/core';
import { FormattedMessage } from 'react-intl';
import { StatePanel } from '~/shared/ui/StatePanel';
import { useBalance, BalanceRequestError } from '../../lib/hooks/useBalance';
import { Balance } from '../Balance';

export function WalletBalance() {
  const balance = useBalance(15000);
  if (balance.isPending) return <StatePanel state="loading" />;
  if (balance.isError) {
    if (balance.error instanceof BalanceRequestError && [401, 403].includes(balance.error.status)) {
      return (
        <Stack align="center" p="lg" role="status">
          <Text>
            <FormattedMessage id="balance.signIn" />
          </Text>
          <Button component={Link} href="/account" color="dark">
            <FormattedMessage id="auth.signIn" />
          </Button>
        </Stack>
      );
    }
    return <StatePanel state="error" onRetry={() => void balance.refetch()} />;
  }
  return (
    <Balance {...balance.data} onRefresh={() => void balance.refetch()} refreshing={balance.isFetching} />
  );
}
