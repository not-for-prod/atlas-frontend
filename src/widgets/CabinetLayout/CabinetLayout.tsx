'use client';
import Link from 'next/link';
import { type ReactNode, type RefObject } from 'react';
import { Avatar, Menu, UnstyledButton } from '@mantine/core';
import { FormattedMessage, useIntl } from 'react-intl';
import { IconBrandTelegram, IconUser, IconArrowUpRight } from '@tabler/icons-react';
import { Logout } from '~/features/Logout';
import { BrandLink } from '~/shared/ui/BrandLink';
import { PageContainer } from '~/shared/ui/PageContainer';
import styles from './CabinetLayout.module.css';
export function CabinetLayout({
  children,
  onProfile,
  onSupport,
  avatarRef,
}: {
  children: ReactNode;
  onProfile: () => void;
  onSupport: () => void;
  avatarRef: RefObject<HTMLButtonElement | null>;
}) {
  const intl = useIntl();
  return (
    <PageContainer>
      <a className={styles.skip} href="#main">
        <FormattedMessage id="a11y.skip" />
      </a>
      <header className={styles.header}>
        <BrandLink />
        <span className={styles.label}>
          <FormattedMessage id="auth.form.eyebrow" />
        </span>
        <Menu position="bottom-end" width={240}>
          <Menu.Target>
            <UnstyledButton
              ref={avatarRef}
              className={styles.avatar}
              aria-label={intl.formatMessage({ id: 'cabinet.userMenu' })}
            >
              <Avatar radius="xl" color="dark" variant="light">
                <IconUser size={22} aria-hidden="true" />
              </Avatar>
            </UnstyledButton>
          </Menu.Target>
          <Menu.Dropdown>
            <Menu.Item leftSection={<IconUser size={18} />} onClick={onProfile}>
              <FormattedMessage id="cabinet.nav.profile" />
            </Menu.Item>
            <Menu.Item leftSection={<IconBrandTelegram size={18} />} onClick={onSupport}>
              <FormattedMessage id="cabinet.telegram" />
            </Menu.Item>
            <Menu.Divider />
            <Logout variant="menu" />
            <Menu.Item component={Link} href="/" leftSection={<IconArrowUpRight size={18} />}>
              <FormattedMessage id="cabinet.website" />
            </Menu.Item>
          </Menu.Dropdown>
        </Menu>
      </header>
      <main id="main" tabIndex={-1} className={styles.main}>
        {children}
      </main>
      <footer className={styles.footer}>
        <FormattedMessage id="footer" />
        <span>© 2026</span>
      </footer>
    </PageContainer>
  );
}
