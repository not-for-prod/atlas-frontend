import { mkdir } from 'node:fs/promises';
import { expect, test } from './fixtures/cabinet';
const stages = [
  'CARD_ISSUE_STAGE_RESERVING_FUNDS',
  'CARD_ISSUE_STAGE_REGISTERING_CLIENT',
  'CARD_ISSUE_STAGE_VERIFYING_IDENTITY',
  'CARD_ISSUE_STAGE_FUNDING_ACCOUNT',
  'CARD_ISSUE_STAGE_ISSUING_CARD',
  'CARD_ISSUE_STAGE_FINALIZING_CARD',
];
for (const width of [375, 1440]) {
  test(`issuance progress persists through polling and reload at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 });
    let failed = false;
    let current = 1;
    const issue = () => ({
      id: 'journey-1',
      cardTypeId: 'travel',
      name: 'Поездки',
      status: failed ? 'CARD_ISSUE_STATUS_FAILED' : 'CARD_ISSUE_STATUS_VERIFYING',
      stage: stages[current],
      price: { currency: 'USD', amount: '20' },
      fee: { currency: 'USD', amount: '5' },
      steps: stages.map((stage, index) => ({
        stage,
        completedAt: index < current ? '2026-10-03T17:41:49.240464Z' : null,
        status:
          index < current
            ? 'CARD_ISSUE_STEP_STATUS_COMPLETED'
            : index === current
              ? failed
                ? 'CARD_ISSUE_STEP_STATUS_FAILED'
                : 'CARD_ISSUE_STEP_STATUS_CURRENT'
              : 'CARD_ISSUE_STEP_STATUS_UPCOMING',
      })),
    });
    await page.route('**/v1/cards/tariff', (route) => route.fulfill({ status: 503, json: {} }));
    await page.route('**/v1/card-issues/current', (route) =>
      route.fulfill({ json: failed ? {} : { issue: issue() } }),
    );
    await page.route('**/v1/card-issues/journey-1', (route) => route.fulfill({ json: { issue: issue() } }));
    await page.goto('/cabinet?issue=journey-1');
    const modal = page.getByRole('dialog');
    const registration = modal.getByText('Регистрация у провайдера').locator('..').locator('..');
    await expect(registration).toHaveAttribute('aria-current', 'step');
    current = 2;
    const verification = modal.getByText('Проверка личности').locator('..').locator('..');
    await expect(verification).toHaveAttribute('aria-current', 'step');
    await page.reload();
    await expect(verification).toHaveAttribute('aria-current', 'step');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await mkdir('artifacts/screenshots', { recursive: true });
    await page.screenshot({ path: `artifacts/screenshots/issuance-progress-${width}.png`, fullPage: true });
    current = 3;
    failed = true;
    await expect(modal.getByText('Ошибка на этом этапе')).toBeVisible();
    await expect(modal.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '50');
    await page.screenshot({
      path: `artifacts/screenshots/issuance-progress-failed-${width}.png`,
      fullPage: true,
    });
    await page.reload();
    await expect(modal.getByText('Ошибка на этом этапе')).toBeVisible();
    expect(new URL(page.url()).searchParams.get('issue')).toBe('journey-1');
    await page.keyboard.press('Escape');
    await expect(modal).toHaveCount(0);
  });
}
