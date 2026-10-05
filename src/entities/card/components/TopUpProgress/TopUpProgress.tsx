import { type CardTopUp } from '../../lib/topUpApi';
import { OperationProgress, type OperationStep } from '~/shared/ui/OperationProgress';
export function TopUpProgress({ order }: { order: CardTopUp }) {
  if (!order.steps?.length) return null;
  return (
    <OperationProgress
      label="topup.progressLabel"
      steps={order.steps.map((step) => ({
        id: step.stage!,
        label: `topup.stage.${step.stage}`,
        status: step.status!.replace('CARD_TOP_UP_STEP_STATUS_', '').toLowerCase() as OperationStep['status'],
        completedAt: step.completedAt,
      }))}
    />
  );
}
