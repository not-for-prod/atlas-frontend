'use client';
import Link from 'next/link';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Stack, Text, Title } from '@mantine/core';
import { IconLock, IconArrowUpRight } from '@tabler/icons-react';
import { FormattedMessage, useIntl } from 'react-intl';
import { PublicLayout } from '~/widgets/PublicLayout';
import { Authenticate } from '~/features/Authenticate';
import { CardVisual, useCardTariff } from '~/entities/card';
import { PromotionalPanel } from '~/shared/ui/PromotionalPanel';
import styles from './Authorization.module.css';
export function Authorization({
  category,
  callbackError,
  deleting = false,
  deleted = false,
}: {
  category?: string;
  callbackError?: 'callback' | 'account_not_found';
  deleting?: boolean;
  deleted?: boolean;
}) {
  const intl = useIntl();
  const router = useRouter();
  const tariff = useCardTariff();
  const selected =
    tariff.isSuccess && !tariff.isFetching
      ? tariff.data.categories.find((item) => item.id === category)
      : undefined;
  const name = selected?.name || selected?.id;
  useEffect(() => {
    if (category && tariff.isSuccess && !tariff.isFetching && !selected) {
      router.replace(`/account${callbackError ? `?authError=${callbackError}` : ''}`, { scroll: false });
    }
  }, [category, tariff.isSuccess, tariff.isFetching, selected, callbackError, router]);
  return (
    <PublicLayout>
      <div className={styles.main}>
        <PromotionalPanel className={styles.story} aria-label={intl.formatMessage({ id: 'auth.story' })}>
          <p className={styles.eyebrow}>
            <FormattedMessage id="auth.eyebrow" />
          </p>
          <Title order={2}>
            <FormattedMessage id="auth.story" />
          </Title>
          <Text className={styles.description}>
            <FormattedMessage id="auth.story.description" />
          </Text>
          <div className={styles.art} aria-hidden="true">
            <CardVisual design="neutral" palette={selected?.palette} label={name} presentation="artwork" />
          </div>
          <Text size="sm" className={styles.artNote}>
            <FormattedMessage id="auth.artNote" />
          </Text>
        </PromotionalPanel>
        <section className={styles.form}>
          <Stack gap="xl" className={styles.formContent}>
            <div className={styles.formEyebrow}>
              <span className={styles.lock}>
                <IconLock size={18} stroke={1.7} aria-hidden="true" />
              </span>
              <FormattedMessage id="auth.form.eyebrow" />
            </div>
            <Stack gap="sm">
              <Title order={1}>
                <FormattedMessage id={deleting ? 'auth.delete.title' : 'auth.title'} />
              </Title>
              <Text c="dimmed">
                <FormattedMessage
                  id={deleting ? 'auth.delete.verify' : deleted ? 'auth.delete.success' : 'auth.subtitle'}
                />
              </Text>
              {selected && (
                <Text size="sm" className={styles.selection}>
                  <FormattedMessage id="account.selection" values={{ name }} />
                </Text>
              )}
            </Stack>
            <Authenticate
              tariff={selected?.id || (tariff.isSuccess && !tariff.isFetching ? undefined : category)}
              callbackError={callbackError}
              deleting={deleting}
            />
            <Link href="/#how" className={styles.helpLink}>
              <FormattedMessage id="auth.how" />
              <IconArrowUpRight size={16} aria-hidden="true" />
            </Link>
          </Stack>
        </section>
      </div>
    </PublicLayout>
  );
}
