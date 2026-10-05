import { type CardIssue } from '../../lib/issuanceApi';
import { OperationProgress, type OperationStep } from '~/shared/ui/OperationProgress';
export function IssueProgress({ issue, compact = false }: { issue: CardIssue; compact?: boolean }) {
  if (issue.status === 'CARD_ISSUE_STATUS_COMPLETED' || !issue.steps?.length) return null;
  const failed = issue.status === 'CARD_ISSUE_STATUS_FAILED' || issue.status === 'CARD_ISSUE_STATUS_REJECTED';
  return (
    <OperationProgress
      label="issuance.progressLabel"
      compact={compact}
      unknownStageMessage={
        failed && (!issue.stage || issue.stage === 'CARD_ISSUE_STAGE_UNSPECIFIED')
          ? 'issuance.unknownStage'
          : undefined
      }
      steps={issue.steps.map((step) => ({
        id: step.stage!,
        label: `issuance.stage.${step.stage}`,
        status: step.status!.replace('CARD_ISSUE_STEP_STATUS_', '').toLowerCase() as OperationStep['status'],
        completedAt: step.completedAt,
      }))}
    />
  );
}
