import Link from 'next/link';
import { FormattedMessage, useIntl } from 'react-intl';
import styles from './BrandLink.module.css';
export function BrandLink() {
  const intl = useIntl();
  return (
    <Link className={styles.brand} href="/" aria-label={intl.formatMessage({ id: 'brand' })}>
      <FormattedMessage id="brand" />
      <span>.</span>
    </Link>
  );
}
