import Link from 'next/link';
import { Button } from '@mantine/core';
import { FormattedMessage } from 'react-intl';
import { FaqItem } from './components';
import styles from './Faq.module.css';
export function Faq() {
  return (
    <section id="faq" className={styles.section} aria-labelledby="faq-title">
      <h2 id="faq-title">
        <FormattedMessage id="landing.faq.title" />
      </h2>
      <p className={styles.description}>
        <FormattedMessage id="landing.faq.description" />
      </p>
      <div className={styles.list}>
        {(['launch', 'price', 'balance', 'wallet', 'methods'] as const).map((topic) => (
          <FaqItem key={topic} topic={topic} />
        ))}
      </div>
      <Button component={Link} href="/account" variant="outline" color="dark" radius="lg">
        <FormattedMessage id="landing.faq.more" />
      </Button>
    </section>
  );
}
