'use client';
import { FormattedMessage } from 'react-intl';
import { BrandLink } from '~/shared/ui/BrandLink';
import styles from './PublicFooter.module.css';
export function PublicFooter() {
  return (
    <footer className={styles.footer}>
      <div className={styles.top}>
        <BrandLink />
        <a href="#top">
          <FormattedMessage id="landing.footer.top" /> ↑
        </a>
      </div>
      <p>
        <FormattedMessage id="landing.footer.description" />
      </p>
      <p className={styles.note}>
        <FormattedMessage id="landing.footer.note" />
      </p>
    </footer>
  );
}
