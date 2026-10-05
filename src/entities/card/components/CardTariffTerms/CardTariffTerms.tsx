import { Stack, Text } from '@mantine/core';
import { FormattedMessage, useIntl } from 'react-intl';
import { formatUsd } from '~/entities/client-asset';
import { type CardCategory } from '../../model/tariff';
import { formatCardFee } from '../../lib/utils/formatCardFee';
export function CardTariffTerms({ category }: { category: CardCategory }) {
  const intl = useIntl();
  return (
    <Stack gap={4}>
      {category.fees.issue_price && category.fees.issue_commission ? (
        <>
          <Text size="sm">
            <FormattedMessage id="issuance.price" />: {formatCardFee(category.fees.issue_price, intl)}
          </Text>
          <Text size="sm">
            <FormattedMessage id="issuance.fee" />: {formatCardFee(category.fees.issue_commission, intl)}
          </Text>
        </>
      ) : (
        <Text size="sm">
          <FormattedMessage id="cardTariff.issue" />: {formatCardFee(category.fees.issue, intl)}
        </Text>
      )}
      <Text size="sm">
        <FormattedMessage id="cardTariff.deposit" />: {formatCardFee(category.fees.deposit, intl)}
      </Text>
      {category.topup?.minimalAmount !== undefined && (
        <Text size="sm">
          <FormattedMessage
            id="cardTariff.topupMinimum"
            values={{ amount: formatUsd(category.topup.minimalAmount) }}
          />
        </Text>
      )}
      {category.topup?.maximumAmount !== undefined && (
        <Text size="sm">
          <FormattedMessage
            id="cardTariff.topupMaximum"
            values={{ amount: formatUsd(category.topup.maximumAmount) }}
          />
        </Text>
      )}
    </Stack>
  );
}
