import { FormattedMessage } from 'react-intl';
import { type CardIssue } from '../../lib/issuanceApi';
import { useCardTariff } from '../../lib/hooks/useCardTariff';
import { CardVisual } from '../CardVisual';
import { IssueProgress } from '../IssueProgress';
export function PendingCardVisual({ issue }: { issue: CardIssue }) {
  const tariff = useCardTariff();
  const category = tariff.data?.categories.find((item) => item.id === issue.cardTypeId);
  return (
    <CardVisual
      design="neutral"
      palette={category?.palette}
      presentation="owned"
      label={issue.name || category?.name}
      status={<FormattedMessage id="issuance.pendingCard" />}
      balance={<IssueProgress issue={issue} compact />}
      actions={<FormattedMessage id="issuance.detailsShort" />}
    />
  );
}
