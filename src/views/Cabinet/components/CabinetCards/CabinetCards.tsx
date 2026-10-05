'use client';
import Link from 'next/link';
import { useRef } from 'react';
import { ActionIcon, Alert, Button, Group, Stack, Text, Title, UnstyledButton } from '@mantine/core';
import { IconArrowLeft, IconArrowRight, IconPlus, IconRefresh } from '@tabler/icons-react';
import { FormattedMessage, useIntl } from 'react-intl';
import {
  OwnedCardVisual,
  PendingCardVisual,
  useCards,
  useCurrentIssue,
  isIssueTerminal,
} from '~/entities/card';
import { CardLoading } from './components/CardLoading';
import styles from './CabinetCards.module.css';
export function CabinetCards({
  cardHref,
  onIssue,
  onPendingIssue,
}: {
  cardHref: string;
  onIssue: () => void;
  onPendingIssue: () => void;
}) {
  const intl = useIntl();
  const track = useRef<HTMLDivElement>(null);
  const query = useCards();
  const current = useCurrentIssue();
  const pendingIssue = current.data && !isIssueTerminal(current.data) ? current.data : undefined;
  const cards = query.data?.pages.flatMap((page) => page.cards || []) || [];
  return (
    <section aria-label={intl.formatMessage({ id: 'cabinet.cards' })}>
      <Stack gap="sm">
        <Group justify="space-between">
          <Title order={1} size="h3">
            <FormattedMessage id="cabinet.cards" />
          </Title>
          <Group gap={8}>
            {query.isPending && (
              <Text c="dimmed" size="sm" role="status" className={styles.loadingLabel}>
                <FormattedMessage id="cabinet.cards.loading" />
              </Text>
            )}
            <ActionIcon
              variant="subtle"
              color="dark"
              radius="xl"
              loading={query.isFetching && !query.isFetchingNextPage}
              aria-label={intl.formatMessage({ id: 'cabinet.cards.refresh' })}
              onClick={() => void query.refetch()}
            >
              <IconRefresh size={18} />
            </ActionIcon>
            <ActionIcon
              variant="default"
              radius="xl"
              disabled={query.isPending}
              aria-label={intl.formatMessage({ id: 'cabinet.cards.previous' })}
              onClick={() => track.current?.scrollBy({ left: -300 })}
            >
              <IconArrowLeft size={18} />
            </ActionIcon>
            <ActionIcon
              variant="default"
              radius="xl"
              disabled={query.isPending}
              aria-label={intl.formatMessage({ id: 'cabinet.cards.next' })}
              onClick={() => track.current?.scrollBy({ left: 300 })}
            >
              <IconArrowRight size={18} />
            </ActionIcon>
          </Group>
        </Group>
        {current.isError && (
          <Alert color="red" role="alert">
            <FormattedMessage id="issuance.pollError" />
            <Button variant="subtle" onClick={() => void current.refetch()}>
              <FormattedMessage id="issuance.refresh" />
            </Button>
          </Alert>
        )}
        {query.isError && (
          <Alert color="red" role="alert">
            <FormattedMessage id="cabinet.cards.error" />
            <Button variant="subtle" onClick={() => void query.refetch()}>
              <FormattedMessage id="cabinet.cards.retry" />
            </Button>
          </Alert>
        )}
        {!query.isPending && !query.isError && cards.length === 0 && !pendingIssue && (
          <Text c="dimmed" role="status">
            <FormattedMessage id="cabinet.cards.empty" />
          </Text>
        )}
        <div ref={track} className={styles.track} data-loading={query.isPending || undefined}>
          {query.isPending && <CardLoading />}
          {!query.isError &&
            cards.map((card) => (
              <UnstyledButton
                key={card.id}
                className={styles.card}
                component={Link}
                href={`${cardHref}${cardHref.includes('?') ? '&' : '?'}id=${encodeURIComponent(card.id!)}`}
                aria-label={intl.formatMessage(
                  { id: 'cabinet.card.openStored' },
                  { name: card.name || card.id },
                )}
              >
                <OwnedCardVisual card={card} />
              </UnstyledButton>
            ))}
          {pendingIssue && (
            <UnstyledButton
              className={styles.card}
              onClick={onPendingIssue}
              aria-label={intl.formatMessage({ id: 'issuance.openDetails' }, { name: pendingIssue.name })}
            >
              <PendingCardVisual issue={pendingIssue} />
            </UnstyledButton>
          )}
          <Button
            className={styles.issue}
            aria-label={intl.formatMessage({ id: 'action.issue' })}
            disabled={!!pendingIssue || current.isPending || current.isError}
            title={pendingIssue ? intl.formatMessage({ id: 'issuance.waitForCurrent' }) : undefined}
            variant="default"
            onClick={onIssue}
            leftSection={<IconPlus size={20} />}
          >
            <Stack gap={4} align="center">
              <FormattedMessage id="action.issue" />
              {pendingIssue && (
                <Text component="span" size="xs" c="inherit" className={styles.pendingNote}>
                  <FormattedMessage id="issuance.waitForCurrent" />
                </Text>
              )}
            </Stack>
          </Button>
        </div>
        {query.hasNextPage && (
          <Button
            variant="default"
            loading={query.isFetchingNextPage}
            onClick={() => void query.fetchNextPage()}
          >
            <FormattedMessage id="cabinet.cards.more" />
          </Button>
        )}
      </Stack>
    </section>
  );
}
