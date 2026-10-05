import { mkdir } from 'node:fs/promises';
import { expect, test } from './fixtures/cabinet';

for (const width of [375, 1440]) {
  test(`payment details, fees and keyboard return at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 });
    const receipt = {
      id: 'payment-123',
      createdAt: '2026-09-27T12:36:00Z',
      updatedAt: '2026-09-27T12:38:00Z',
      type: 'PAYMENT_TYPE_DEPOSIT',
      status: 'PAYMENT_STATUS_COMPLETED',
      amount: { currency: 'USDT', amount: '7.4813' },
      requisite: {
        crypto: {
          currency: 'USDT',
          network: 'tron',
          address: 'TMw1Mz7rV4xHWAb92LrGzPb6QkbBzZx',
          memo: 'memo-123',
        },
      },
    };
    let detailRequests = 0;
    let unavailable = true;
    await page.route('**/v1/balances', (route) =>
      route.fulfill({
        json: {
          balances: [
            { available: { currency: 'USD', amount: '0' }, reserved: { currency: 'USD', amount: '0' } },
          ],
        },
      }),
    );
    await page.route('**/v1/payments?*', (route) => route.fulfill({ json: { payments: [receipt] } }));
    await page.route('**/v1/payments/payment-123', (route) => {
      detailRequests++;
      return unavailable
        ? route.fulfill({ status: 503, json: {} })
        : route.fulfill({
            json: {
              payment: {
                ...receipt,
                fee: { currency: 'USDT', amount: '0.25' },
                creditedAmount: { currency: 'USD', amount: '7.23' },
              },
            },
          });
    });
    await page.goto('/cabinet');
    const row = page.getByRole('button', { name: /Открыть платёж/ });
    await row.focus();
    expect(detailRequests).toBe(0);
    await page.keyboard.press('Enter');
    const dialog = page.getByRole('dialog', { name: 'Детали платежа' });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole('alert')).toBeVisible();
    unavailable = false;
    await dialog.getByRole('button', { name: 'Повторить', exact: true }).click();
    await expect(dialog.getByText('0,25 USDT', { exact: true })).toBeVisible();
    await expect(dialog.getByText('7,23 USD', { exact: true })).toBeVisible();
    await expect(dialog.getByText(receipt.requisite.crypto.address, { exact: true })).toBeVisible();
    await expect(dialog.getByText('payment-123', { exact: true })).toBeVisible();
    await expect(dialog.getByText('Статус', { exact: true })).toBeVisible();
    await expect(dialog.getByText('Подтверждён', { exact: true })).toBeVisible();
    const refresh = dialog.getByRole('button', { name: 'Обновить', exact: true });
    const heading = dialog.getByRole('heading', { name: 'Детали платежа' });
    const refreshBox = await refresh.boundingBox();
    const headingBox = await heading.boundingBox();
    expect(
      Math.abs(refreshBox!.y + refreshBox!.height / 2 - headingBox!.y - headingBox!.height / 2),
    ).toBeLessThan(2);
    const requestsBeforeRefresh = detailRequests;
    await refresh.click();
    await expect.poll(() => detailRequests).toBeGreaterThan(requestsBeforeRefresh);
    expect(await dialog.evaluate((el) => el.scrollWidth <= el.clientWidth)).toBe(true);
    await mkdir('artifacts/screenshots', { recursive: true });
    await dialog.screenshot({ path: `artifacts/screenshots/payment-details-${width}.png` });
    await page.keyboard.press('Escape');
    await expect(dialog).toHaveCount(0);
    await expect(row).toBeFocused();
  });
}

test('missing fee and credit are not displayed as zero', async ({ page }) => {
  const payment = {
    id: 'missing-fee',
    createdAt: '2026-09-27T12:36:00Z',
    type: 'PAYMENT_TYPE_DEPOSIT',
    status: 'PAYMENT_STATUS_PENDING',
    amount: { currency: 'USDT', amount: '1' },
  };
  await page.route('**/v1/balances', (route) =>
    route.fulfill({
      json: {
        balances: [
          { available: { currency: 'USD', amount: '0' }, reserved: { currency: 'USD', amount: '0' } },
        ],
      },
    }),
  );
  await page.route('**/v1/payments?*', (route) => route.fulfill({ json: { payments: [payment] } }));
  await page.route('**/v1/payments/missing-fee', (route) => route.fulfill({ json: { payment } }));
  await page.goto('/cabinet');
  await page.getByRole('button', { name: /Открыть платёж/ }).click();
  const dialog = page.getByRole('dialog', { name: 'Детали платежа' });
  await expect(dialog.getByText('Не указано', { exact: true })).toHaveCount(2);
  await expect(dialog.getByText('1 USDT', { exact: true })).toBeVisible();
  await expect(dialog.getByText('+1 USDT', { exact: true })).toHaveCount(0);
});
