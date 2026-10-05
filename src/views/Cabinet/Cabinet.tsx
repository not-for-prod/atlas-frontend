'use client';
import { useCallback, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Button, Modal, Stack, Title } from '@mantine/core';
import { IconArrowDownLeft, IconArrowLeft, IconArrowUpRight } from '@tabler/icons-react';
import { FormattedMessage, useIntl } from 'react-intl';
import { ActionTile } from '~/shared/ui/ActionTile';
import { ActionGroup } from '~/shared/ui/ActionGroup';
import { WalletBalance } from '~/entities/client-asset';
import { CabinetLayout } from '~/widgets/CabinetLayout';
import { parseCardCategory } from '~/entities/card';
import { AccountAccess } from '~/features/AccountAccess';
import { NotificationPromo } from '~/features/NotificationPromo';
import { TelegramSupport } from '~/features/TelegramSupport';
import { CabinetCards } from './components/CabinetCards';
import { CabinetCardDetail } from './components/CabinetCardDetail';
import { CabinetHistory } from './components/CabinetHistory';
import { CabinetProfile } from './components/CabinetProfile';
import { DepositBalance } from '~/features/DepositBalance';
import { CabinetIssue } from './components/CabinetIssue';
import { type CabinetSection } from './model';
import styles from './Cabinet.module.css';
export function Cabinet({
  section,
  tariff,
  cardID,
}: {
  section: CabinetSection;
  tariff?: string;
  cardID?: string;
}) {
  const router = useRouter();
  const intl = useIntl();
  const selected = parseCardCategory(tariff);
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const trackedIssueId = searchParams.get('issue');
  const selectCategory = useCallback(
    (id: string | undefined) => {
      const params = new URLSearchParams(searchParams);
      if (id) params.set('tariff', id);
      else params.delete('tariff');
      router.replace(`${pathname}${params.size ? `?${params}` : ''}`, { scroll: false });
    },
    [pathname, router, searchParams],
  );
  const [dialog, setDialog] = useState<string | null>(
    ['support', 'deposit', 'issue'].includes(section) ? section : trackedIssueId ? 'issue' : null,
  );
  const issuanceDialog = dialog === 'issue' || dialog === 'issue-progress';
  const avatarRef = useRef<HTMLButtonElement>(null);
  const returnTarget = useRef<HTMLElement | null>(null);
  function openDialog(value: string, fromMenu = false) {
    returnTarget.current = fromMenu ? avatarRef.current : (document.activeElement as HTMLElement);
    setDialog(value);
  }
  function closeDialog() {
    setDialog(null);
    if (['support', 'deposit', 'issue'].includes(section) || issuanceDialog)
      router.replace(`/cabinet${selected ? `?tariff=${encodeURIComponent(selected)}` : ''}`, {
        scroll: false,
      });
  }
  return (
    <CabinetLayout
      avatarRef={avatarRef}
      onProfile={() =>
        router.push(`/cabinet/profile${selected ? `?tariff=${encodeURIComponent(selected)}` : ''}`)
      }
      onSupport={() => openDialog('support', true)}
    >
      <AccountAccess>
        {section === 'card' || section === 'profile' ? (
          <Stack gap="lg">
            <Button
              component={Link}
              href={`/cabinet${selected ? `?tariff=${encodeURIComponent(selected)}` : ''}`}
              variant="subtle"
              color="dark"
              className={styles.back}
              leftSection={<IconArrowLeft size={18} />}
            >
              <FormattedMessage id="cabinet.back" />
            </Button>
            <Title order={1} size="h2">
              <FormattedMessage id={section === 'card' ? 'cabinet.card.title' : 'cabinet.nav.profile'} />
            </Title>
            {section === 'card' ? <CabinetCardDetail key={cardID} id={cardID} /> : <CabinetProfile />}
          </Stack>
        ) : (
          <Stack gap="lg">
            <NotificationPromo />
            <CabinetCards
              cardHref={`/cabinet/card${selected ? `?tariff=${encodeURIComponent(selected)}` : ''}`}
              onIssue={() => openDialog('issue')}
              onPendingIssue={() => openDialog('issue-progress')}
            />
            <WalletBalance />
            <ActionGroup className={styles.accountActions}>
              <ActionTile
                label="action.deposit"
                icon={<IconArrowDownLeft size={20} />}
                accent
                inline
                onSelect={() => openDialog('deposit')}
              />
              <ActionTile
                label="action.withdrawComingSoon"
                icon={<IconArrowUpRight size={20} />}
                inline
                disabled
              />
            </ActionGroup>
            <CabinetHistory />
          </Stack>
        )}
        <Modal
          opened={dialog !== null}
          onClose={closeDialog}
          size={issuanceDialog ? 'xl' : 'lg'}
          title={intl.formatMessage({
            id:
              dialog === 'issue-progress' || (dialog === 'issue' && trackedIssueId)
                ? 'issuance.progressTitle'
                : `cabinet.nav.${dialog || 'profile'}`,
          })}
          closeButtonProps={{ 'aria-label': intl.formatMessage({ id: 'preview.dialog.close' }) }}
          returnFocus={false}
          onExitTransitionEnd={() =>
            (returnTarget.current?.isConnected ? returnTarget.current : avatarRef.current)?.focus()
          }
        >
          {dialog === 'support' && <TelegramSupport />}
          {dialog === 'deposit' && <DepositBalance onClose={closeDialog} />}
          {issuanceDialog && <CabinetIssue selected={selected} onSelect={selectCategory} />}
        </Modal>
      </AccountAccess>
    </CabinetLayout>
  );
}
