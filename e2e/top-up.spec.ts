import { mkdir } from 'node:fs/promises';
import { expect, test } from './fixtures/cabinet';
const stages = [
  'CARD_TOP_UP_STAGE_RESERVING_FUNDS',
  'CARD_TOP_UP_STAGE_FUNDING_ACCOUNT',
  'CARD_TOP_UP_STAGE_TOPPING_UP_CARD',
];
for (const width of [375, 1440]) {
  test(`top-up reservation error, silent background completion and reload at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 1000 });
    const card = {
      id: 'stored-card',
      cardTypeId: 'CATEGORY_TRAVEL',
      currency: 'USD',
      status: 'CARD_STATUS_ACTIVE',
      balance: { currency: 'USD', amount: '0' },
    };
    let accepted = false;
    let insufficient = true;
    let stage = 1;
    let completed = false;
    const order = () => ({
      id: 'topup-1',
      cardId: card.id,
      status: completed
        ? 'CARD_TOP_UP_STATUS_COMPLETED'
        : stage === 1
          ? 'CARD_TOP_UP_STATUS_FUNDING'
          : 'CARD_TOP_UP_STATUS_TOPPING_UP',
      stage: stages[stage],
      amount: { amount: '10', currency: 'USD' },
      fee: { amount: '1', currency: 'USD' },
      steps: stages.map((value, index) => ({
        stage: value,
        status:
          completed || index < stage
            ? 'CARD_TOP_UP_STEP_STATUS_COMPLETED'
            : index === stage
              ? 'CARD_TOP_UP_STEP_STATUS_CURRENT'
              : 'CARD_TOP_UP_STEP_STATUS_UPCOMING',
      })),
    });
    await page.route('**/v1/balances', (route) =>
      route.fulfill({
        json: {
          balances: [
            {
              available: { amount: '11', currency: 'USD' },
              reserved: { amount: '900', currency: 'USD' },
            },
          ],
        },
      }),
    );
    await page.route('**/v1/cards/stored-card', (route) =>
      route.fulfill({
        json: { card: { ...card, balance: { currency: 'USD', amount: completed ? '10' : '0' } } },
      }),
    );
    await page.route('**/v1/cards/stored-card/top-ups/current', (route) =>
      route.fulfill({ json: accepted && !completed ? { topUp: order() } : {} }),
    );
    await page.route('**/v1/cards/stored-card/top-ups/quote', (route) =>
      route.fulfill({
        json: { amount: { amount: '10', currency: 'USD' }, fee: { amount: '1', currency: 'USD' } },
      }),
    );
    await page.route('**/v1/cards/stored-card/top-ups', (route) => {
      const body = route.request().postDataJSON();
      expect(body.amount.amount).toBe('10');
      expect(body.expectedCommission).toBe('1');
      expect(body.idempotencyKey).toBeTruthy();
      if (insufficient) return route.fulfill({ status: 412, json: { message: 'insufficient funds' } });
      accepted = true;
      return route.fulfill({ json: { topUp: order() } });
    });
    await page.route('**/v1/card-top-ups/topup-1', (route) => route.fulfill({ json: { topUp: order() } }));
    await page.goto('/cabinet/card?id=stored-card');
    await page.getByRole('button', { name: 'Пополнить', exact: true }).click();
    const modal = page.getByRole('dialog');
    await modal.getByLabel('Сумма пополнения').fill('10');
    await modal.getByRole('button', { name: 'Пополнить карту' }).click();
    await expect(
      modal.getByText('Недостаточно средств на балансе. Уменьшите сумму или пополните баланс.'),
    ).toBeVisible();
    insufficient = false;
    await modal.getByRole('button', { name: 'Повторить' }).click();
    await expect(modal).toHaveCount(0);
    await expect(page.getByRole('progressbar')).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Пополнить', exact: true })).toBeDisabled();
    stage = 2;
    await page.reload();
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await expect(page.getByRole('progressbar')).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Пополнить', exact: true })).toBeDisabled();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await mkdir('artifacts/screenshots', { recursive: true });
    await page.screenshot({ path: `artifacts/screenshots/top-up-silent-${width}.png`, fullPage: true });
    completed = true;
    await expect(page.getByRole('button', { name: 'Пополнить', exact: true })).toBeEnabled();
    await page.getByRole('button', { name: 'Показать баланс', exact: true }).click();
    await expect(page.getByText('10,00 $', { exact: true })).toBeVisible();
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await page.getByRole('button', { name: 'Пополнить', exact: true }).click();
    await modal.getByRole('button', { name: 'Новое пополнение' }).click();
    await expect(modal.getByLabel('Сумма пополнения')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(modal).toHaveCount(0);
  });
}
