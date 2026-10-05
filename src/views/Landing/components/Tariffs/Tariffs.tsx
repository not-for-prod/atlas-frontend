'use client';
import { FormattedMessage } from 'react-intl';
import { useCardTariff } from '~/entities/card';
import { StatePanel } from '~/shared/ui/StatePanel';
import { TariffCard } from './components';
import styles from './Tariffs.module.css';
export function Tariffs() {
  const tariff = useCardTariff();
  return (
    <section id="tariffs" className={styles.section} aria-labelledby="tariffs-title">
      <h2 id="tariffs-title">
        <FormattedMessage id="landing.tariffs.title" />
      </h2>
      <p className={styles.description}>
        <FormattedMessage id="landing.tariffs.description" />
      </p>
      <p className={styles.notice}>
        <span aria-hidden="true">↗</span>
        <FormattedMessage id="landing.tariffs.notice" />
      </p>
      {tariff.isPending || tariff.isFetching ? (
        <StatePanel
          state="loading"
          titleId="cardTariff.loading"
          descriptionId="cardTariff.loadingDescription"
        />
      ) : tariff.isError ? (
        <StatePanel
          state="error"
          titleId="cardTariff.error"
          descriptionId="cardTariff.errorDescription"
          onRetry={() => void tariff.refetch()}
        />
      ) : !tariff.data?.categories.length ? (
        <StatePanel state="empty" titleId="cardTariff.empty" descriptionId="cardTariff.emptyDescription" />
      ) : (
        <div className={styles.grid}>
          {tariff.data.categories.map((category) => (
            <TariffCard key={category.id} category={category} />
          ))}
        </div>
      )}
    </section>
  );
}
