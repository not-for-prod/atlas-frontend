import { isDecimalAmount } from '~/shared/lib/decimal';
import { backendOrigin } from '~/shared/api/backendOrigin';
import {
  AtlasCardV1CardIssueStatus,
  AtlasCardV1CardIssueStage,
  AtlasCardV1CardIssueStepStatus,
  type AtlasCardV1CardIssue,
  type AtlasCardV1IssueCardRequest,
} from '~/generated/atlas/model';
import { CardRequestError } from './cardsApi';
export type CardIssue = AtlasCardV1CardIssue;
export type IssueCardRequest = AtlasCardV1IssueCardRequest;
export function isIssueTerminal(issue: CardIssue) {
  return ['CARD_ISSUE_STATUS_COMPLETED', 'CARD_ISSUE_STATUS_FAILED', 'CARD_ISSUE_STATUS_REJECTED'].includes(
    issue.status || '',
  );
}
async function request(
  path: string,
  signal?: AbortSignal,
  body?: IssueCardRequest,
): Promise<CardIssue | null> {
  const response = await fetch(`${backendOrigin()}${path}`, {
    credentials: 'include',
    cache: 'no-store',
    redirect: 'error',
    signal: AbortSignal.any([AbortSignal.timeout(15000), ...(signal ? [signal] : [])]),
    ...(body
      ? { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }
      : {}),
  });
  if (!response.ok) throw new CardRequestError(response.status);
  const data = await response.json();
  if (!data || typeof data !== 'object' || Array.isArray(data)) throw new CardRequestError(503);
  if (!data.issue && path === '/v1/card-issues/current') return null;
  const issue: CardIssue = data.issue;
  if (
    !issue ||
    typeof issue.id !== 'string' ||
    !issue.id ||
    typeof issue.cardTypeId !== 'string' ||
    typeof issue.name !== 'string' ||
    !issue.status ||
    issue.status === 'CARD_ISSUE_STATUS_UNSPECIFIED' ||
    !Object.values(AtlasCardV1CardIssueStatus).includes(issue.status) ||
    [issue.price, issue.fee].some(
      (money) => !money || money.currency !== 'USD' || !isDecimalAmount(money.amount),
    )
  )
    throw new CardRequestError(503);
  if (issue.stage && !Object.values(AtlasCardV1CardIssueStage).includes(issue.stage))
    throw new CardRequestError(503);
  if (issue.steps !== undefined) {
    const stages = Object.values(AtlasCardV1CardIssueStage).filter(
      (stage) => stage !== 'CARD_ISSUE_STAGE_UNSPECIFIED',
    );
    const expectedStages =
      Array.isArray(issue.steps) &&
      issue.steps.some((step) => step?.stage === 'CARD_ISSUE_STAGE_VERIFYING_IDENTITY')
        ? stages
        : stages.filter((stage) => stage !== 'CARD_ISSUE_STAGE_VERIFYING_IDENTITY');
    if (
      !Array.isArray(issue.steps) ||
      issue.steps.length !== expectedStages.length ||
      issue.steps.some(
        (step, index) =>
          !step ||
          step.stage !== expectedStages[index] ||
          !step.status ||
          step.status === 'CARD_ISSUE_STEP_STATUS_UNSPECIFIED' ||
          !Object.values(AtlasCardV1CardIssueStepStatus).includes(step.status) ||
          (step.completedAt != null &&
            (typeof step.completedAt !== 'string' || !Number.isFinite(Date.parse(step.completedAt)))),
      )
    )
      throw new CardRequestError(503);
  }
  return issue;
}
export function getCurrentIssue(signal?: AbortSignal) {
  return request('/v1/card-issues/current', signal);
}
export async function getIssue(id: string, signal?: AbortSignal) {
  const issue = await request(`/v1/card-issues/${encodeURIComponent(id)}`, signal);
  if (issue?.id !== id) throw new CardRequestError(503);
  return issue;
}
export async function issueCard(body: IssueCardRequest) {
  const issue = await request('/v1/cards', undefined, body);
  if (!issue) throw new CardRequestError(503);
  return issue;
}
