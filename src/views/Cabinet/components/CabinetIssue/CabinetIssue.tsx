'use client';
import { useEffect, useState } from 'react';
import { Badge, Button, Stack, Text, Title } from '@mantine/core';
import { FormattedMessage } from 'react-intl';
import { CardVisual, CardTariffTerms, useCardTariff } from '~/entities/card';
import { StatePanel } from '~/shared/ui/StatePanel';
import { ProfileKYC } from '~/features/ProfileKYC';
import { IssueCard } from '~/features/IssueCard';
import styles from '../../Cabinet.module.css';
import issueStyles from './CabinetIssue.module.css';
export function CabinetIssue({
  selected,
  onSelect,
}: {
  selected?: string;
  onSelect: (category: string | undefined) => void;
}) {
  const [locked, setLocked] = useState(false);
  const tariff = useCardTariff();
  useEffect(() => {
    if (
      tariff.isSuccess &&
      !tariff.isFetching &&
      selected &&
      !tariff.data.categories.some((category) => category.id === selected)
    )
      onSelect(undefined);
  }, [tariff.isSuccess, tariff.isFetching, tariff.data, selected, onSelect]);
  return (
    <Stack>
      <IssueCard
        onLocked={setLocked}
        verification={<ProfileKYC key={selected} cardTypeId={selected} />}
        category={
          tariff.isSuccess && !tariff.isFetching
            ? tariff.data.categories.find((category) => category.id === selected)
            : undefined
        }
      />
      {!locked && (tariff.isPending || tariff.isFetching) && (
        <StatePanel
          state="loading"
          titleId="cardTariff.loading"
          descriptionId="cardTariff.loadingDescription"
        />
      )}
      {!locked && tariff.isError && (
        <StatePanel
          state="error"
          titleId="cardTariff.error"
          descriptionId="cardTariff.errorDescription"
          onRetry={() => void tariff.refetch()}
        />
      )}
      {!locked && tariff.isSuccess && !tariff.data.categories.length && (
        <StatePanel state="empty" titleId="cardTariff.empty" descriptionId="cardTariff.emptyDescription" />
      )}
      {!locked && tariff.isSuccess && !tariff.isFetching && (
        <>
          <Text size="sm" c="dimmed">
            <FormattedMessage id="landing.tariffs.notice" />
          </Text>
          <div className={issueStyles.grid}>
            {tariff.data.categories.map((category) => {
              const name = category.name || category.id;
              return (
                <article
                  key={category.id}
                  className={`${styles.panel} ${issueStyles.option} ${selected === category.id ? styles.selected : ''}`}
                >
                  <div className={styles.artwork}>
                    <CardVisual
                      design="neutral"
                      palette={category.palette}
                      label={name}
                      presentation="artwork"
                    />
                  </div>
                  <Stack gap="xs" align="flex-start">
                    <Title order={2} size="h3">
                      {name}
                    </Title>
                    {selected === category.id && (
                      <Badge color="dark">
                        <FormattedMessage id="cabinet.issue.selected" />
                      </Badge>
                    )}
                  </Stack>
                  <Text size="sm" c="dimmed">
                    {category.description}
                  </Text>
                  <Stack gap="xs">
                    <Text size="sm">
                      <FormattedMessage id={category.requiresKyc ? 'kyc.required' : 'kyc.notRequired'} />
                    </Text>
                    <CardTariffTerms category={category} />
                  </Stack>
                  <Button
                    color="dark"
                    disabled={locked}
                    aria-pressed={selected === category.id}
                    onClick={() => onSelect(category.id)}
                  >
                    <FormattedMessage id="cardTariff.select" />
                  </Button>
                </article>
              );
            })}
          </div>
        </>
      )}
    </Stack>
  );
}
