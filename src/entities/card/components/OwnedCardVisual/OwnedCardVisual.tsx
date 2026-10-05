import { type ReactNode } from 'react';
import { FormattedMessage } from 'react-intl';
import { type Card } from '../../lib/cardsApi';
import { useCardTariff } from '../../lib/hooks/useCardTariff';
import { CardVisual } from '../CardVisual';
import { CardBalance } from '../CardBalance';
export function OwnedCardVisual({
  card,
  withVisibilityToggle = false,
  action,
}: {
  card: Card;
  withVisibilityToggle?: boolean;
  action?: ReactNode;
}) {
  const tariff = useCardTariff();
  const cardType = tariff.isSuccess
    ? tariff.data.categories.find((type) => type.id === card.cardTypeId)
    : undefined;
  return (
    <CardVisual
      design="neutral"
      palette={cardType?.palette}
      presentation="owned"
      label={card.name || cardType?.name || undefined}
      typeName={cardType?.name}
      status={<FormattedMessage id={`cabinet.card.status.${card.status}`} />}
      actions={action}
      balance={
        <CardBalance
          amount={card.balance?.currency === 'USD' ? card.balance.amount : undefined}
          withVisibilityToggle={withVisibilityToggle}
        />
      }
    />
  );
}
