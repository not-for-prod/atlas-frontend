import { mkdir } from 'node:fs/promises';
import { expect, test } from './fixtures/cabinet';

for (const width of [375, 1440]) {
  test(`grouped crypto history at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1100 });
    await page.route('**/v1/balances', (route) =>
      route.fulfill({
        json: {
          balances: [
            { available: { currency: 'USD', amount: '0' }, reserved: { currency: 'USD', amount: '0' } },
          ],
        },
      }),
    );
    await page.route('**/v1/payments?*', (route) =>
      route.fulfill({
        json: {
          payments: [
            {
              id: 'one',
              createdAt: '2026-09-27T12:36:00Z',
              amount: { currency: 'USDT', amount: '7.4813' },
              status: 'PAYMENT_STATUS_COMPLETED',
            },
            {
              id: 'two',
              createdAt: '2026-09-27T10:15:00Z',
              amount: { currency: 'USDT', amount: '5' },
              status: 'PAYMENT_STATUS_COMPLETED',
            },
            {
              id: 'three',
              createdAt: '2026-09-26T14:00:00Z',
              amount: { currency: 'USDT', amount: '20' },
              status: 'PAYMENT_STATUS_PENDING',
            },
            {
              id: 'four',
              createdAt: '2026-09-25T09:00:00Z',
              amount: { currency: 'USDT', amount: '10' },
              status: 'PAYMENT_STATUS_FAILED',
            },
          ].map((payment) => ({
            ...payment,
            type: 'PAYMENT_TYPE_DEPOSIT',
            requisite: {
              crypto: { address: 'TMw1Mz7rV4xHWAb92LrGzPb6QkbBzZx', currency: 'USDT', network: 'tron' },
            },
          })),
        },
      }),
    );
    await page.goto('/cabinet');
    const heading = page.getByRole('heading', { name: 'История платежей' });
    await expect(heading).toBeVisible();
    const history = heading.locator('../..');
    await history.scrollIntoViewIfNeeded();
    await expect(history.getByRole('heading', { level: 3 })).toHaveCount(3);
    await expect(history.getByRole('listitem')).toHaveCount(4);
    await expect(history.getByText('+7,4813 USDT', { exact: true })).toBeVisible();
    await expect(history.getByText('20 USDT', { exact: true })).toBeVisible();
    await expect(history.getByText('Криптопоступление ожидает подтверждения')).toBeVisible();
    await expect(history.getByRole('img', { name: 'USDT · TRON' })).toHaveCount(4);
    for (const img of await history.locator('img').all()) {
      await expect(img).toHaveJSProperty('complete', true);
      expect(await img.evaluate((node: HTMLImageElement) => node.naturalWidth)).toBeGreaterThan(0);
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    await history.getByRole('button', { name: 'Обновить' }).focus();
    await expect(history.getByRole('button', { name: 'Обновить' })).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(history.getByRole('listitem')).toHaveCount(4);
    await mkdir('artifacts/screenshots', { recursive: true });
    await history.screenshot({
      path: `artifacts/screenshots/history-reference-${width}.png`,
      animations: 'disabled',
    });
  });
}
