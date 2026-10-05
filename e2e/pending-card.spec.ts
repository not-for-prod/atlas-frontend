import { mkdir } from 'node:fs/promises';
import { expect, test } from './fixtures/cabinet';
const stages = [
  'RESERVING_FUNDS',
  'REGISTERING_CLIENT',
  'VERIFYING_IDENTITY',
  'FUNDING_ACCOUNT',
  'ISSUING_CARD',
  'FINALIZING_CARD',
];
for (const width of [375, 1440]) {
  test(`pending card opens issuance details and becomes an owned card at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 });
    let completed = false;
    const issue = () => ({
      id: 'pending-issue',
      cardTypeId: 'CATEGORY_TRAVEL',
      name: 'Поездки',
      status: completed ? 'CARD_ISSUE_STATUS_COMPLETED' : 'CARD_ISSUE_STATUS_ISSUING',
      stage: 'CARD_ISSUE_STAGE_ISSUING_CARD',
      price: { currency: 'USD', amount: '20' },
      fee: { currency: 'USD', amount: '5' },
      steps: stages.map((stage, index) => ({
        stage: `CARD_ISSUE_STAGE_${stage}`,
        status: `CARD_ISSUE_STEP_STATUS_${completed || index < 4 ? 'COMPLETED' : index === 4 ? 'CURRENT' : 'UPCOMING'}`,
      })),
    });
    await page.route('**/v1/card-issues/current', (route) =>
      route.fulfill({ json: completed ? {} : { issue: issue() } }),
    );
    await page.route('**/v1/card-issues/pending-issue', (route) =>
      route.fulfill({ json: { issue: issue() } }),
    );
    await page.route('**/v1/cards?*', (route) =>
      route.fulfill({
        json: {
          cards: completed
            ? [
                {
                  id: 'issued-card',
                  cardTypeId: 'CATEGORY_TRAVEL',
                  name: 'Поездки',
                  currency: 'USD',
                  status: 'CARD_STATUS_ACTIVE',
                },
              ]
            : [],
        },
      }),
    );
    await page.route('**/v1/cards/tariff', (route) =>
      route.fulfill({
        json: {
          tariffId: 'cards',
          currency: 'USD',
          categories: {
            CATEGORY_TRAVEL: {
              name: 'Особая карта',
              palette: { background: '#123456', foreground: '#ffffff' },
              fees: {},
            },
          },
        },
      }),
    );
    await page.route('**/v1/balances', (route) =>
      route.fulfill({
        json: {
          balances: [
            { available: { currency: 'USD', amount: '100' }, reserved: { currency: 'USD', amount: '25' } },
          ],
        },
      }),
    );
    await page.route('**/v1/payments?*', (route) => route.fulfill({ json: { payments: [] } }));
    await page.goto('/cabinet');
    const pending = page.getByRole('button', { name: 'Поездки выпускается — открыть детали' });
    await expect(pending).toBeVisible();
    await expect(pending.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '67');
    await expect(page.getByRole('button', { name: 'Выпустить карту', exact: true })).toBeDisabled();
    await pending.focus();
    await page.keyboard.press('Enter');
    const dialog = page.getByRole('dialog');
    await expect(dialog.getByRole('heading', { name: 'Выпуск карты', exact: true })).toBeVisible();
    await expect(dialog.getByRole('list')).toBeVisible();
    await expect(dialog.getByRole('list').getByText('Выпуск карты', { exact: true })).toBeVisible();
    await expect(dialog.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '67');
    await expect(dialog).toHaveCSS('opacity', '1');
    await mkdir('artifacts/screenshots', { recursive: true });
    await page.screenshot({
      path: `artifacts/screenshots/pending-card-details-${width}.png`,
      fullPage: true,
    });
    await page.keyboard.press('Escape');
    await expect(dialog).toHaveCount(0);
    await expect(pending).toBeFocused();
    await page.reload();
    await expect(pending).toBeVisible();
    await expect(dialog).toHaveCount(0);
    completed = true;
    await expect(pending).toHaveCount(0);
    await expect(page.getByRole('progressbar')).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Выпустить карту', exact: true })).toBeEnabled();
    await expect(page.getByRole('link', { name: /Поездки/ })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  });
}
