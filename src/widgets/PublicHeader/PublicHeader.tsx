'use client';
import Link from 'next/link';
import { Button } from '@mantine/core';
import { FormattedMessage, useIntl } from 'react-intl';
import { BrandLink } from '~/shared/ui/BrandLink';
import styles from './PublicHeader.module.css';
export function PublicHeader() {
  const intl = useIntl();
  return (
    <header id="top" className={styles.header}>
      <a href="#main" className={styles.skip}>
        <FormattedMessage id="a11y.skip" />
      </a>
      <BrandLink />
      <nav className={styles.nav} aria-label={intl.formatMessage({ id: 'landing.nav' })}>
        <Link href="/#tariffs">
          <FormattedMessage id="landing.nav.tariffs" />
        </Link>
        <Link href="/#how">
          <FormattedMessage id="landing.nav.how" />
        </Link>
        <Link href="/#faq">
          <FormattedMessage id="landing.nav.faq" />
        </Link>
      </nav>
      <details className={styles.mobileMenu}>
        <summary>
          <FormattedMessage id="landing.menu" />
        </summary>
        <nav aria-label={intl.formatMessage({ id: 'landing.nav' })}>
          <Link href="/#tariffs">
            <FormattedMessage id="landing.nav.tariffs" />
          </Link>
          <Link href="/#how">
            <FormattedMessage id="landing.nav.how" />
          </Link>
          <Link href="/#faq">
            <FormattedMessage id="landing.nav.faq" />
          </Link>
        </nav>
      </details>
      <Button component={Link} href="/account" color="dark" className={styles.login}>
        <FormattedMessage id="landing.login" />
      </Button>
    </header>
  );
}
