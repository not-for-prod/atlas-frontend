'use client';
import Link from 'next/link';
import { type ReactNode } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import styles from './PreviewShell.module.css';
export function PreviewShell({ children, active }: { children: ReactNode; active: 'dashboard' | 'gallery' }) {
  const intl = useIntl();
  return (
    <div className={styles.shell}>
      <a className={styles.skip} href="#main">
        <FormattedMessage id="a11y.skip" />
      </a>
      <div className={styles.banner}>
        <span className={styles.dot} />
        <FormattedMessage id="preview" />
        <span className={styles.bannerNote}>
          <FormattedMessage id="preview.note" />
        </span>
      </div>
      <header className={styles.header}>
        <Link href="/preview" className={styles.brand}>
          <FormattedMessage id="brand" />
          <span>.</span>
        </Link>
        <nav className={styles.nav} aria-label={intl.formatMessage({ id: 'a11y.navigation' })}>
          <Link href="/preview" aria-current={active === 'dashboard' ? 'page' : undefined}>
            <FormattedMessage id="nav.dashboard" />
          </Link>
          <Link href="/preview/gallery" aria-current={active === 'gallery' ? 'page' : undefined}>
            <FormattedMessage id="nav.gallery" />
          </Link>
        </nav>
        <span className={styles.monogram} aria-hidden="true">
          А
        </span>
      </header>
      <main id="main" className={styles.main}>
        {children}
      </main>
      <footer className={styles.footer}>
        <FormattedMessage id="footer" />
        <span>© 2026</span>
      </footer>
    </div>
  );
}
