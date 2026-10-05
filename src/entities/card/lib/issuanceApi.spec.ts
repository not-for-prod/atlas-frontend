import { afterEach, expect, it, vi } from 'vitest';
import { getCurrentIssue, getIssue, issueCard } from './issuanceApi';
vi.mock('~/shared/api/backendOrigin', () => ({ backendOrigin: () => 'https://atlas.test' }));
afterEach(() => vi.unstubAllGlobals());
const stages = [
  'RESERVING_FUNDS',
  'REGISTERING_CLIENT',
  'VERIFYING_IDENTITY',
  'FUNDING_ACCOUNT',
  'ISSUING_CARD',
  'FINALIZING_CARD',
];
const issue = {
  id: '7d64f9f5-6bc1-425c-b254-cfd154d66e8b',
  cardTypeId: 'apple_google_pay',
  name: 'bru',
  status: 'CARD_ISSUE_STATUS_FUNDING',
  stage: 'CARD_ISSUE_STAGE_FUNDING_ACCOUNT',
  price: { amount: '5', currency: 'USD' },
  fee: { amount: '1', currency: 'USD' },
  steps: stages.map((stage, index) => ({
    stage: `CARD_ISSUE_STAGE_${stage}`,
    status: `CARD_ISSUE_STEP_STATUS_${index < 3 ? 'COMPLETED' : index === 3 ? 'CURRENT' : 'UPCOMING'}`,
    completedAt: index < 3 ? '2026-10-03T17:41:49.240464Z' : null,
  })),
};
it('accepts protobuf null timestamps during submission, recovery and polling', async () => {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockImplementation(() => Promise.resolve(Response.json({ issue }))),
  );
  expect(await getCurrentIssue()).toEqual(issue);
  expect(await getIssue(issue.id)).toEqual(issue);
  expect(
    await issueCard({
      cardTypeId: issue.cardTypeId,
      name: issue.name,
      idempotencyKey: 'request',
      expectedPrice: '5',
      expectedCommission: '1',
    }),
  ).toEqual(issue);
});
it.each(['invalid', 42, ''])('still rejects malformed completed timestamps %s', async (completedAt) => {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue(
      Response.json({
        issue: {
          ...issue,
          steps: issue.steps.map((step, index) => (index === 0 ? { ...step, completedAt } : step)),
        },
      }),
    ),
  );
  await expect(getCurrentIssue()).rejects.toMatchObject({ status: 503 });
});
