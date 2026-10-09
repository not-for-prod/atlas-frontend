import { mkdir } from 'node:fs/promises';
import { expect, test } from './fixtures/cabinet';

for (const width of [375, 1440]) {
  test(`mixed SBP and crypto history at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1100 });
    const sbp = {
      id: 'sbp:failed',
      type: 'PAYMENT_TYPE_DEPOSIT',
      status: 'PAYMENT_STATUS_FAILED',
      createdAt: '2026-10-07T14:54:33.543275Z',
      updatedAt: '2026-10-07T14:59:33.543274Z',
      amount: { currency: 'USD', amount: '100.25' },
      requisite: null,
    };
    const crypto = {
      id: 'crypto:paid',
      type: 'PAYMENT_TYPE_DEPOSIT',
      status: 'PAYMENT_STATUS_COMPLETED',
      createdAt: '2026-10-07T14:50:00Z',
      amount: { currency: 'USDT', amount: '20' },
      requisite: {
        crypto: { currency: 'USDT', network: 'tron', address: 'TMw1Mz7rV4xHWAb92LrGzPb6QkbBzZx' },
      },
    };
    await page.route('**/v1/payments?*', (route) => route.fulfill({ json: { payments: [sbp, crypto] } }));
    await page.route('**/v1/payments/sbp%3Afailed', (route) => route.fulfill({ json: { payment: sbp } }));
    await page.goto('/cabinet');
    const heading = page.getByRole('heading', { name: 'История платежей' });
    await expect(heading).toBeVisible();
    const history = heading.locator('../..');
    await expect(history.getByRole('listitem')).toHaveCount(2);
    await expect(history.getByText('Пополнение через СБП', { exact: true })).toBeVisible();
    await expect(history.getByRole('img', { name: 'СБП', exact: true })).toHaveCount(1);
    await expect(history.getByRole('img', { name: 'USDT · TRON', exact: true })).toHaveCount(1);
    await expect(history.getByText('+20 USDT', { exact: true })).toBeVisible();
    const row = history.getByRole('listitem').filter({ hasText: 'Пополнение через СБП' });
    await expect(row.getByText('100,25 USD', { exact: true })).toBeVisible();
    await expect(row.getByText('Пополнение не выполнено', { exact: true })).toBeVisible();
    await expect(row.getByText(/Криптопоступление/)).toHaveCount(0);
    const open = row.getByRole('button', { name: /Открыть платёж/ });
    await open.focus();
    await page.keyboard.press('Enter');
    const dialog = page.getByRole('dialog', { name: 'Детали платежа' });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByText('Пополнение через СБП', { exact: true })).toBeVisible();
    await expect(dialog.getByText('100,25 USD', { exact: true })).toBeVisible();
    await expect(dialog.getByText('Не выполнен', { exact: true })).toBeVisible();
    await expect(dialog.getByRole('img', { name: 'USDT · TRON' })).toHaveCount(0);
    await expect(dialog.getByText('Комиссия сервиса', { exact: true })).toHaveCount(0);
    expect(await dialog.evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(true);
    await mkdir('artifacts/screenshots', { recursive: true });
    await dialog.screenshot({ path: `artifacts/screenshots/sbp-history-detail-${width}.png` });
    await page.keyboard.press('Escape');
    await expect(dialog).toHaveCount(0);
    await expect(open).toBeFocused();
  });
}
