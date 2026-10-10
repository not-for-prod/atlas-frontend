'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader, Stack, Text } from '@mantine/core';
import { FormattedMessage } from 'react-intl';
import { parseCardCategory } from '~/entities/card';
export function KYCReturn() {
  const router = useRouter();
  useEffect(() => {
    let card: string | undefined;
    try {
      card = parseCardCategory(sessionStorage.getItem('atlas.kyc.cardTypeId') ?? undefined);
    } catch {
      /* Resume from the profile if storage is unavailable. */
    }
    // Keep the public selection until the next verification; this is also safe under StrictMode.
    // Callback query parameters are never evidence of approval.
    router.replace(card ? `/cabinet/issue?${new URLSearchParams({ tariff: card })}` : '/cabinet/profile');
  }, [router]);
  return (
    <Stack align="center" p="xl" role="status">
      <Loader />
      <Text>
        <FormattedMessage id="kyc.returning" />
      </Text>
    </Stack>
  );
}
