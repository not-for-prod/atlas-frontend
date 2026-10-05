import { mkdir } from 'node:fs/promises';
import { expect, test } from './fixtures/cabinet';
for (const operation of ['card-issue', 'card-top-up']) {
  for (const width of [375, 1440]) {
    test(`${operation} settles into a fee-only receipt at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 1000 });
      let failed = false;
      const receipt = () => ({
        id: `${operation}:order`,
        createdAt: '2026-09-30T12:00:00Z',
        updatedAt: '2026-09-30T12:01:00Z',
        type: operation === 'card-issue' ? 'PAYMENT_TYPE_CARD_ISSUE' : 'PAYMENT_TYPE_CARD_TOP_UP',
        status: failed ? 'PAYMENT_STATUS_FAILED' : 'PAYMENT_STATUS_PENDING',
        amount: { currency: 'USD', amount: failed ? '5' : '25' },
        fee: { currency: 'USD', amount: '5' },
        reservedAmount: { currency: 'USD', amount: failed ? '0' : '25' },
        releasedAmount: { currency: 'USD', amount: failed ? '20' : '0' },
      });
      await page.route('**/v1/balances', (route) =>
        route.fulfill({
          json: {
            balances: [
              { available: { currency: 'USD', amount: '95' }, reserved: { currency: 'USD', amount: '0' } },
            ],
          },
        }),
      );
      await page.route('**/v1/payments?*', (route) => route.fulfill({ json: { payments: [receipt()] } }));
      await page.route(`**/v1/payments/${operation}*`, (route) =>
        route.fulfill({ json: { payment: receipt() } }),
      );
      await page.goto('/cabinet');
      await expect(
        page.getByText(operation === 'card-issue' ? 'Выпуск карты' : 'Пополнение карты', { exact: true }),
      ).toBeVisible();
      await expect(page.getByText('25,00 USD', { exact: true })).toBeVisible();
      failed = true;
      // Existing history polling must eventually show the settlement without a page reload.
      await expect(page.getByText('−5,00 USD', { exact: true })).toBeVisible({ timeout: 25000 });
      const row = page.getByRole('button', { name: /Открыть платёж/ });
      await row.focus();
      await page.keyboard.press('Enter');
      const dialog = page.getByRole('dialog', { name: 'Детали платежа' });
      await expect(dialog).toBeVisible();
      await expect(dialog.getByText('−5,00 USD', { exact: true })).toBeVisible();
      await expect(dialog.getByText('5,00 USD', { exact: true })).toBeVisible();
      await expect(dialog.getByText('20,00 USD', { exact: true })).toBeVisible();
      await expect(dialog.getByText('Возвращено из резерва', { exact: true })).toBeVisible();
      await expect(dialog.getByRole('img', { name: 'USDT · TRON' })).toHaveCount(0);
      expect(await dialog.evaluate((el) => el.scrollWidth <= el.clientWidth)).toBe(true);
      await mkdir('artifacts/screenshots', { recursive: true });
      await dialog.screenshot({ path: `artifacts/screenshots/${operation}-payment-${width}.png` });
      await page.keyboard.press('Escape');
      await expect(dialog).toHaveCount(0);
      await expect(row).toBeFocused();
    });
  }
}
