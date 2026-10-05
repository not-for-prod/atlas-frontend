import Link from 'next/link';
import { Button } from '@mantine/core';
import { FormattedMessage, useIntl } from 'react-intl';
import { CardVisual, CardTariffTerms, type CardCategory } from '~/entities/card';
import styles from './TariffCard.module.css';
export function TariffCard({ category }: { category: CardCategory }) {
  const intl = useIntl();
  const name = category.name || category.id;
  return (
    <article className={styles.tariff} aria-labelledby={`tariff-${category.id}`}>
      <CardVisual design="neutral" palette={category.palette} label={name} presentation="artwork" />
      <div>
        <h3 id={`tariff-${category.id}`}>{name}</h3>
        {category.description && <p className={styles.description}>{category.description}</p>}
      </div>
      <CardTariffTerms category={category} />
      <Button
        component={Link}
        href={`/account?tariff=${encodeURIComponent(category.id)}`}
        color="dark"
        radius="lg"
        fullWidth
        className={styles.choose}
        aria-label={intl.formatMessage({ id: 'landing.tariffs.chooseLabel' }, { name })}
      >
        <FormattedMessage id="landing.tariffs.choose" />
      </Button>
    </article>
  );
}
