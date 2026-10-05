'use client';
import { useState, type ReactNode } from 'react';
import { MantineProvider } from '@mantine/core';
import { ModalsProvider } from '@mantine/modals';
import { Notifications } from '@mantine/notifications';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { IntlProvider } from 'react-intl';
import messages from '../../../dictionaries/ru.json';
import { BalanceVisibilityProvider } from '~/shared/ui/BalanceVisibilityProvider';
import { theme } from './theme';
export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { retry: false, refetchOnWindowFocus: false },
          mutations: { retry: false },
        },
      }),
  );
  return (
    <IntlProvider locale="ru" messages={messages}>
      <QueryClientProvider client={queryClient}>
        <MantineProvider theme={theme} forceColorScheme="light">
          <ModalsProvider>
            <Notifications />
            <BalanceVisibilityProvider>{children}</BalanceVisibilityProvider>
          </ModalsProvider>
        </MantineProvider>
      </QueryClientProvider>
    </IntlProvider>
  );
}
