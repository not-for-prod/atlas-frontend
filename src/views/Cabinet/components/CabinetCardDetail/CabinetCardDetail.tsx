'use client';
import { useRef, useState } from 'react';
import { Alert, Button, Modal, Skeleton, Stack } from '@mantine/core';
import { IconArrowDownLeft, IconCreditCardOff } from '@tabler/icons-react';
import { FormattedMessage, useIntl } from 'react-intl';
import { useSearchParams } from 'next/navigation';
import { RevealCard } from '~/features/RevealCard';
import { TopUpCard } from '~/features/TopUpCard';
import {
  OwnedCardVisual,
  useCard,
  CardRequestError,
  useCurrentTopUp,
  useTopUp,
  isTopUpTerminal,
} from '~/entities/card';
import { ActionTile } from '~/shared/ui/ActionTile';
import { PaymentHistory } from '~/widgets/PaymentHistory';
import { ActionGroup } from '~/shared/ui/ActionGroup';
import styles from './CabinetCardDetail.module.css';
export function CabinetCardDetail({ id }: { id?: string }) {
  const query = useCard(id);
  const intl = useIntl();
  const retained = useSearchParams().get('topup');
  const current = useCurrentTopUp(id);
  const [topUpOpen, setTopUpOpen] = useState(false);
  const revealRef = useRef<HTMLButtonElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const topUpRef = useRef<HTMLButtonElement>(null);
  const restoredId = retained || current.data?.id;
  const background = useTopUp(restoredId, id);
  const order = background.data || current.data;
  const topUpPending = !!order && !isTopUpTerminal(order);
  const [revealedCard, setRevealedCard] = useState<string>();
  const flipped = !!id && revealedCard === id;
  if (!id)
    return (
      <Alert role="alert">
        <FormattedMessage id="cabinet.card.select" />
      </Alert>
    );
  if (query.isPending) return <Skeleton height={240} />;
  if (query.isError || !query.data)
    return (
      <Alert color="red" role="alert">
        <FormattedMessage
          id={
            query.error instanceof CardRequestError && query.error.status === 404
              ? 'cabinet.card.notFound'
              : 'cabinet.cards.error'
          }
        />
        <Button variant="subtle" onClick={() => void query.refetch()}>
          <FormattedMessage id="cabinet.cards.retry" />
        </Button>
      </Alert>
    );
  const card = query.data;
  return (
    <Stack gap="lg">
      <div className={styles.card} ref={cardRef} tabIndex={-1} aria-label={card.name}>
        <div className={`${styles.faces} ${flipped ? styles.flipped : ''}`}>
          <div className={styles.front} aria-hidden={flipped} inert={flipped}>
            <OwnedCardVisual
              card={card}
              withVisibilityToggle
              action={
                <Button
                  ref={revealRef}
                  className={styles.reveal}
                  variant="transparent"
                  color="var(--visual-ink)"
                  size="xs"
                  radius="xl"
                  onClick={() => setRevealedCard(id)}
                  aria-label={intl.formatMessage({ id: 'cabinet.card.details' })}
                  title={intl.formatMessage({ id: 'cabinet.card.details' })}
                  aria-pressed={flipped}
                >
                  <FormattedMessage id="cabinet.card.showDetailsShort" />
                </Button>
              }
            />
          </div>
          <div className={styles.back} aria-hidden={!flipped} inert={!flipped}>
            {flipped && (
              <RevealCard
                key={id}
                cardId={id}
                onHide={() => {
                  setRevealedCard(undefined);
                  requestAnimationFrame(() => revealRef.current?.focus());
                }}
              />
            )}
          </div>
        </div>
      </div>
      <ActionGroup className={styles.actions}>
        <ActionTile
          ref={topUpRef}
          disabled={topUpPending || card.status !== 'CARD_STATUS_ACTIVE' || card.currency !== 'USD'}
          onSelect={() => setTopUpOpen(true)}
          label="cabinet.card.topup"
          icon={<IconArrowDownLeft size={20} />}
          accent
          inline
        />
        <ActionTile disabled label="cabinet.card.close" icon={<IconCreditCardOff size={20} />} inline />
      </ActionGroup>
      {background.isError && (
        <Alert color="red" role="alert">
          <FormattedMessage id="issuance.pollError" />
          <Button variant="subtle" onClick={() => void background.refetch()}>
            <FormattedMessage id="issuance.refresh" />
          </Button>
        </Alert>
      )}
      {order && ['CARD_TOP_UP_STATUS_FAILED', 'CARD_TOP_UP_STATUS_REJECTED'].includes(order.status || '') && (
        <Alert color="red" role="alert">
          <FormattedMessage id={`topup.${order.status}`} />
        </Alert>
      )}
      <Modal
        opened={topUpOpen}
        onClose={() => {
          setTopUpOpen(false);
        }}
        title={intl.formatMessage({ id: 'cabinet.card.topup' })}
        closeButtonProps={{ 'aria-label': intl.formatMessage({ id: 'preview.dialog.close' }) }}
        returnFocus={false}
        onExitTransitionEnd={() => (topUpRef.current?.disabled ? cardRef.current : topUpRef.current)?.focus()}
      >
        <TopUpCard cardId={card.id!} onAccepted={() => setTopUpOpen(false)} />
      </Modal>
      <PaymentHistory titleMessage="cabinet.card.operations" cardId={card.id} />
    </Stack>
  );
}
