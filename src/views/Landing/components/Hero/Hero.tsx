import Link from 'next/link';
import { Button, Group } from '@mantine/core';
import { FormattedMessage } from 'react-intl';
import { PromotionalPanel } from '~/shared/ui/PromotionalPanel';
import { CardFan } from './components';
import styles from './Hero.module.css';
export function Hero() {
  return (
    <PromotionalPanel className={styles.hero} aria-labelledby="landing-title">
      <div className={styles.copy}>
        <p className={styles.badge}>
          <span />
          <FormattedMessage id="landing.hero.badge" />
        </p>
        <h1 id="landing-title">
          <FormattedMessage id="landing.hero.title" />
        </h1>
        <p className={styles.description}>
          <FormattedMessage id="landing.hero.description" />
        </p>
        <Group gap="sm" mt={20}>
          <Button component={Link} href="/account" className={styles.primary} size="lg" radius="lg">
            <FormattedMessage id="landing.hero.primary" />
          </Button>
          <Button
            component="a"
            href="#tariffs"
            variant="outline"
            className={styles.secondary}
            size="lg"
            radius="lg"
          >
            <FormattedMessage id="landing.hero.secondary" />
          </Button>
        </Group>
        <p className={styles.note}>
          <FormattedMessage id="landing.hero.note" />
        </p>
      </div>
      <CardFan />
    </PromotionalPanel>
  );
}
