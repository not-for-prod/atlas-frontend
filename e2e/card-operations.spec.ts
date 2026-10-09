import { mkdir } from 'node:fs/promises';
import { expect, test } from './fixtures/cabinet';
const card = {
  id: 'operations-card',
  cardTypeId: 'CATEGORY_TRAVEL',
  currency: 'USD',
  status: 'CARD_STATUS_ACTIVE',
  name: 'Travel',
  balance: { amount: '100', currency: 'USD' },
};
const operation = {
  id: 'purchase',
  type: 'CARD_OPERATION_TYPE_PURCHASE',
  status: 'CARD_OPERATION_STATUS_AUTHORIZED',
  merchantName: 'Online merchant',
  transactionTime: '2026-10-03T12:00:00Z',
  amount: { amount: '1234.123456', currency: 'EUR' },
  fee: { amount: '0', currency: 'USD' },
  settlement: { amount: '1345.67', currency: 'USD' },
};
for (const width of [375, 1440]) {
  test(`actual card operation history at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 });
    await page.route('**/v1/cards/operations-card', (route) => route.fulfill({ json: { card } }));
    let failed = false;
    const requested: string[] = [];
    await page.route('**/v1/cards/operations-card/operations?*', (route) => {
      const token = new URL(route.request().url()).searchParams.get('page_token') ?? '';
      requested.push(token);
      if (failed) return route.fulfill({ status: 503, json: {} });
      return route.fulfill({
        json: token
          ? {
              operations: [
                {
                  ...operation,
                  id: 'refund',
                  merchantName: 'Refund merchant',
                  type: 'CARD_OPERATION_TYPE_REFUND',
                  status: 'CARD_OPERATION_STATUS_COMPLETED',
                },
              ],
            }
          : { operations: [operation], nextPageToken: 'next' },
      });
    });
    await page.goto('/cabinet/card?id=operations-card');
    await expect(page.getByText('Online merchant')).toBeVisible();
    await expect(page.getByText('Авторизована', { exact: true })).toBeVisible();
    await expect(page.getByText('1 234,123456 EUR', { exact: true })).toBeVisible();
    await expect(page.getByText('Закрытие и информация по карте пока недоступны.')).toHaveCount(0);
    await expect(page.getByText('Refund merchant')).toBeVisible();
    expect(requested).toContain('next');
    const row = page.getByRole('button', { name: 'Открыть операцию: Online merchant, purchase' });
    await row.focus();
    await page.keyboard.press('Enter');
    const details = page.getByRole('dialog', { name: 'Детали операции по карте' });
    await expect(details).toBeVisible();
    await expect(details.getByText('purchase', { exact: true })).toBeVisible();
    await expect(details.getByText('0,00 USD', { exact: true })).toBeVisible();
    await expect(details.getByText('1 345,67 USD', { exact: true })).toBeVisible();
    await page.screenshot({
      path: `artifacts/card-operation-details-${width}.png`,
      fullPage: true,
      animations: 'disabled',
    });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.keyboard.press('Escape');
    await expect(details).toHaveCount(0);
    await expect(row).toBeFocused();
    await row.click();
    await expect(details).toBeVisible();
    await details.getByRole('button', { name: 'Понятно', exact: true }).click();
    await expect(row).toBeFocused();
    const refresh = page.getByRole('button', { name: 'Обновить', exact: true });
    await refresh.focus();
    await page.keyboard.press('Enter');
    await expect(refresh).toBeFocused();
    failed = true;
    await refresh.click();
    await expect(page.getByRole('alert').filter({ hasText: 'Не удалось обновить историю' })).toBeVisible();
    await expect(page.getByText('Online merchant')).toBeVisible();
    failed = false;
    await page.getByRole('button', { name: 'Повторить', exact: true }).click();
    await expect(page.getByRole('alert').filter({ hasText: 'Не удалось обновить историю' })).toHaveCount(0);
    await mkdir('artifacts/screenshots', { recursive: true });
    await page.screenshot({
      path: `artifacts/screenshots/card-operations-${width}.png`,
      fullPage: true,
      animations: 'disabled',
    });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  });
}
test('card operation auth rejection clears private view', async ({ page }) => {
  await page.route('**/v1/cards/operations-card', (route) => route.fulfill({ json: { card } }));
  let expired = false;
  await page.route('**/client', (route) =>
    expired ? route.fulfill({ status: 401, json: {} }) : route.continue(),
  );
  await page.route('**/v1/cards/operations-card/operations?*', (route) =>
    expired ? route.fulfill({ status: 401, json: {} }) : route.fulfill({ json: { operations: [operation] } }),
  );
  await page.goto('/cabinet/card?id=operations-card');
  await expect(page.getByText('Online merchant')).toBeVisible();
  expired = true;
  await page.getByRole('button', { name: 'Обновить', exact: true }).click();
  await expect(page).toHaveURL('/account');
  await expect(page.getByText('Online merchant')).toHaveCount(0);
});
