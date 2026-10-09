'use client';
import Link from 'next/link';
import { IconRefresh } from '@tabler/icons-react';
import { useEffect, useRef, useState } from 'react';
import { ActionIcon, Button, Group, Loader, Stack, Text, Title } from '@mantine/core';
import { FormattedDate, FormattedMessage, useIntl } from 'react-intl';
import { usePayments, PaymentRequestError, groupPaymentsByDate } from '~/entities/payment';
import { useCardOperations, CardRequestError, groupCardOperationsByDate } from '~/entities/card';
import { CardOperationDetails } from '~/features/CardOperationDetails';
import { CardOperationRow } from './components/CardOperationRow';
import { PaymentDetails } from '~/features/PaymentDetails';
import { StatePanel } from '~/shared/ui/StatePanel';
import styles from './PaymentHistory.module.css';
import { PaymentHistoryRow } from './components/PaymentHistoryRow';
export function PaymentHistory({
  titleMessage = 'crypto.history',
  unavailableMessage,
  cardId,
}: {
  titleMessage?: string;
  unavailableMessage?: string;
  cardId?: string;
}) {
  const accountHistory = usePayments({ enabled: !unavailableMessage && !cardId });
  const cardHistory = useCardOperations(cardId, !unavailableMessage);
  const history = cardId ? cardHistory : accountHistory;
  const intl = useIntl();
  const [selectedPaymentId, setSelectedPaymentId] = useState<string | null>(null);
  const [selectedOperation, setSelectedOperation] = useState<{ cardId: string; id: string } | null>(null);
  const sentinel = useRef<HTMLDivElement>(null);
  const { hasNextPage, isFetching, isError, fetchNextPage, data } = history;
  useEffect(() => {
    const target = sentinel.current;
    if (
      unavailableMessage ||
      !target ||
      !hasNextPage ||
      isFetching ||
      isError ||
      typeof IntersectionObserver === 'undefined'
    )
      return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          observer.disconnect();
          void fetchNextPage();
        }
      },
      { rootMargin: '160px' },
    );
    observer.observe(target);
    return () => observer.disconnect();
  }, [hasNextPage, isFetching, isError, fetchNextPage, data, unavailableMessage]);
  if (!unavailableMessage && history.isPending) return <StatePanel state="loading" />;
  const signIn =
    (history.error instanceof PaymentRequestError || history.error instanceof CardRequestError) &&
    [401, 403].includes(history.error.status);
  if (!unavailableMessage && signIn)
    return (
      <Stack>
        <Text>
          <FormattedMessage id="crypto.signIn" />
        </Text>
        <Button component={Link} href="/account" color="dark">
          <FormattedMessage id="auth.signIn" />
        </Button>
      </Stack>
    );
  if (!unavailableMessage && history.isError && !history.data)
    return (
      <StatePanel
        state="error"
        onRetry={() => void history.refetch()}
        titleId={cardId ? 'cardOperation.errorTitle' : undefined}
        descriptionId={cardId ? 'cardOperation.error' : undefined}
      />
    );
  const payments = accountHistory.data?.pages.flatMap((page) => page.payments ?? []) ?? [];
  const operations = [
    ...new Map(
      cardHistory.data?.pages
        .flatMap((page) => page.operations ?? [])
        .map((operation) => [operation.id, operation]),
    ).values(),
  ];
  return (
    <Stack>
      {cardId && !unavailableMessage && (
        <CardOperationDetails
          operation={
            selectedOperation?.cardId === cardId
              ? (operations.find((operation) => operation.id === selectedOperation.id) ?? null)
              : null
          }
          onClose={() => setSelectedOperation(null)}
        />
      )}
      {!cardId && <PaymentDetails paymentId={selectedPaymentId} onClose={() => setSelectedPaymentId(null)} />}
      <Group justify="space-between" wrap="nowrap">
        <Title order={2} size="h3">
          <FormattedMessage id={titleMessage} />
        </Title>
        {!unavailableMessage && (
          <ActionIcon
            variant="transparent"
            color="dark"
            size={40}
            radius="xl"
            aria-label={intl.formatMessage({ id: 'crypto.refresh' })}
            title={intl.formatMessage({ id: 'crypto.refresh' })}
            aria-busy={history.isFetching && !history.isFetchingNextPage}
            aria-disabled={history.isFetching}
            onClick={() => {
              if (!history.isFetching) void history.refetch();
            }}
          >
            {history.isFetching && !history.isFetchingNextPage ? (
              <Loader color="dark" size={20} aria-hidden="true" />
            ) : (
              <IconRefresh size={20} aria-hidden="true" />
            )}
          </ActionIcon>
        )}
      </Group>
      <Stack className={styles.panel}>
        {unavailableMessage ? (
          <Text c="dimmed" size="sm">
            <FormattedMessage id={unavailableMessage} />
          </Text>
        ) : (
          <>
            {history.isError && (
              <Text role="alert" c="red" size="sm">
                <FormattedMessage id="crypto.refreshError" />
                <Button variant="subtle" onClick={() => void history.refetch()}>
                  <FormattedMessage id="cabinet.cards.retry" />
                </Button>
              </Text>
            )}
            {(cardId ? operations.length : payments.length) === 0 ? (
              <Text c="dimmed">
                <FormattedMessage id="cabinet.history.empty" />
              </Text>
            ) : cardId ? (
              groupCardOperationsByDate(operations, intl.timeZone).map((group) => (
                <section key={group.day} className={styles.day}>
                  <Title order={3} className={styles.date}>
                    {group.date ? (
                      <FormattedDate value={group.date} day="numeric" month="long" year="numeric" />
                    ) : (
                      <FormattedMessage id="cardOperation.dateUnavailable" />
                    )}
                  </Title>
                  <ul className={styles.list}>
                    {group.operations.map((operation) => (
                      <CardOperationRow
                        key={operation.id}
                        operation={operation}
                        onSelect={() => setSelectedOperation({ cardId, id: operation.id! })}
                      />
                    ))}
                  </ul>
                </section>
              ))
            ) : (
              groupPaymentsByDate(payments, intl.timeZone).map((group) => (
                <section key={group.day} className={styles.day}>
                  <Title order={3} className={styles.date}>
                    <FormattedDate value={group.date} day="numeric" month="long" year="numeric" />
                  </Title>
                  <ul className={styles.list}>
                    {group.payments.map((payment) => (
                      <PaymentHistoryRow
                        key={payment.id}
                        payment={payment}
                        onSelect={() => setSelectedPaymentId(payment.id!)}
                      />
                    ))}
                  </ul>
                </section>
              ))
            )}
            {history.hasNextPage && (
              <div ref={sentinel}>
                <Button
                  variant="default"
                  loading={history.isFetchingNextPage}
                  onClick={() => void history.fetchNextPage()}
                >
                  <FormattedMessage id="crypto.more" />
                </Button>
              </div>
            )}
          </>
        )}
      </Stack>
    </Stack>
  );
}
