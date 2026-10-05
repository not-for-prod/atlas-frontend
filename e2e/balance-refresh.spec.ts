import { mkdir } from 'node:fs/promises';
import { expect, test } from './fixtures/cabinet';
for (const width of [375, 1440]) {
  test(`balance reload updates both amounts without revealing hidden balances at ${width}px`, async ({
    page,
  }) => {
    let updated = false;
    let requests = 0;
    await page.setViewportSize({ width, height: 1000 });
    await page.route('**/v1/balances', (route) => {
      requests++;
      return route.fulfill({
        json: {
          balances: [
            {
              available: { currency: 'USD', amount: updated ? '1000' : '84500' },
              reserved: { currency: 'USD', amount: updated ? '25' : '1500' },
            },
          ],
        },
      });
    });
    await page.route('**/v1/payments?*', (route) => route.fulfill({ json: { payments: [] } }));
    await page.goto('/cabinet');
    const balance = page.getByRole('region', { name: 'Баланс аккаунта' });
    const refresh = balance.getByRole('button', { name: 'Обновить баланс' });
    await expect(refresh).toBeVisible();
    const previousRequests = requests;
    updated = true;
    await refresh.focus();
    await page.keyboard.press('Enter');
    await expect.poll(() => requests).toBeGreaterThan(previousRequests);
    await expect(refresh).toBeEnabled();
    await expect(balance.getByRole('button', { name: 'Показать баланс' })).toBeVisible();
    await expect(balance).not.toContainText('1 000');
    await balance.getByRole('button', { name: 'Показать баланс' }).click();
    await expect(balance).toContainText(/1\s000,00/);
    await expect(balance).toContainText('25,00');
    await mkdir('artifacts/screenshots', { recursive: true });
    await page.screenshot({
      path: `artifacts/screenshots/balance-refresh-${width}.png`,
      fullPage: true,
      animations: 'disabled',
    });
  });
}
