import { mkdir } from 'node:fs/promises';
import { expect, test } from './fixtures/cabinet';

for (const width of [375, 1440]) {
  test(`deposit lifecycle statuses remain visible at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 });
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.route('**/v1/payments?*', (route) =>
      route.fulfill({
        json: {
          payments: ['PENDING', 'INSPECTION', 'COMPLETED', 'FAILED'].map((status) => ({
            id: status,
            type: 'PAYMENT_TYPE_DEPOSIT',
            status: `PAYMENT_STATUS_${status}`,
            amount: { currency: 'USDT', amount: '1.234567' },
            createdAt: '2026-09-27T00:00:00Z',
          })),
        },
      }),
    );
    await page.goto('/cabinet');
    const title = page.getByRole('heading', { name: 'История платежей' });
    await title.scrollIntoViewIfNeeded();
    for (const label of [
      'Криптопоступление ожидает подтверждения',
      'Криптопоступление на проверке',
      '+1,234567 USDT',
      'Криптопоступление не выполнено',
    ]) {
      await expect(page.getByText(label, { exact: true })).toBeVisible();
    }
    const refresh = page.getByRole('button', { name: 'Обновить', exact: true });
    await refresh.focus();
    await expect(refresh).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(page.getByText('+1,234567 USDT', { exact: true })).toHaveCount(1);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await mkdir('artifacts/screenshots', { recursive: true });
    await page.screenshot({ path: `artifacts/screenshots/crypto-history-${width}.png`, fullPage: true });
    expect(errors).toEqual([]);
  });
}
