import { mkdir } from 'node:fs/promises';
import { expect, test } from './fixtures/cabinet';
for (const width of [375, 1440]) {
  for (const kind of ['issue', 'top-up']) {
    test(`${kind} payment details show only the receipt at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 1000 });
      let completed = false;
      let operationRequests = 0;
      const payment = () => ({
        id: `card-${kind}:journey-1`,
        type: kind === 'issue' ? 'PAYMENT_TYPE_CARD_ISSUE' : 'PAYMENT_TYPE_CARD_TOP_UP',
        status: completed ? 'PAYMENT_STATUS_COMPLETED' : 'PAYMENT_STATUS_PENDING',
        createdAt: '2026-10-03T17:41:39Z',
        cardId: 'card-1',
        amount: { amount: '6', currency: 'USD' },
        fee: { amount: '1', currency: 'USD' },
        reservedAmount: { amount: completed ? '0' : '6', currency: 'USD' },
        releasedAmount: { amount: '0', currency: 'USD' },
      });
      await page.route('**/v1/card-issues/current', (route) => route.fulfill({ json: {} }));
      await page.route('**/v1/cards?*', (route) => route.fulfill({ json: { cards: [] } }));
      await page.route('**/v1/payments?*', (route) => route.fulfill({ json: { payments: [payment()] } }));
      await page.route('**/v1/payments/card-*', (route) => route.fulfill({ json: { payment: payment() } }));
      await page.route('**/v1/card-*/journey-1', (route) => {
        operationRequests++;
        return route.fulfill({ status: 503, json: {} });
      });
      await page.goto('/cabinet');
      const row = page.getByRole('button', { name: /Открыть платёж/ });
      await row.focus();
      await page.keyboard.press('Enter');
      const dialog = page.getByRole('dialog', { name: 'Детали платежа' });
      await expect(dialog.getByText(payment().id, { exact: true })).toBeVisible();
      await expect(dialog.getByRole('tab')).toHaveCount(0);
      await expect(dialog.getByRole('progressbar')).toHaveCount(0);
      await expect(dialog.getByRole('list')).toHaveCount(0);
      await expect(dialog.getByText('1,00 USD', { exact: true })).toBeVisible();
      expect(operationRequests).toBe(0);
      completed = true;
      await dialog.getByRole('button', { name: 'Обновить', exact: true }).click();
      await expect(dialog.getByText('−6,00 USD', { exact: true })).toBeVisible();
      await expect(dialog.getByRole('tab')).toHaveCount(0);
      await expect(dialog.getByRole('progressbar')).toHaveCount(0);
      expect(operationRequests).toBe(0);
      expect(await dialog.evaluate((el) => el.scrollWidth <= el.clientWidth)).toBe(true);
      await expect(dialog).toHaveCSS('opacity', '1');
      await mkdir('artifacts/screenshots', { recursive: true });
      await dialog.screenshot({ path: `artifacts/screenshots/payment-${kind}-receipt-${width}.png` });
      await page.keyboard.press('Escape');
      await expect(dialog).toHaveCount(0);
      await expect(row).toBeFocused();
    });
  }
}
