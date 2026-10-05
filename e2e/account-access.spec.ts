import { mkdir } from 'node:fs/promises';
import { test, expect } from '@playwright/test';
for (const width of [375, 1440]) {
  test(`signed-out cabinet never loads history at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    let privateRequests = 0;
    page.on('request', (request) => {
      if (/\/v1\/(balances|payments)/.test(request.url())) privateRequests++;
    });
    await page.goto('/cabinet');
    await expect(page).toHaveURL(/\/account$/);
    const signIn = page.getByRole('button', { name: 'Войти', exact: true });
    await expect(signIn).toBeVisible();
    await expect(page.getByRole('heading', { name: 'История платежей' })).toHaveCount(0);
    expect(privateRequests).toBe(0);
    await signIn.focus();
    await expect(signIn).toBeFocused();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await mkdir('artifacts/screenshots', { recursive: true });
    await page.screenshot({ path: `artifacts/screenshots/account-signed-out-${width}.png`, fullPage: true });
  });
  test(`balance authentication rejection removes loaded payment details at ${width}px`, async ({
    page,
    context,
  }) => {
    await context.addCookies([
      { name: 'atlas_session', value: 'test-issued-bearer', url: 'http://127.0.0.1:3112', httpOnly: true },
    ]);
    await page.setViewportSize({ width, height: 900 });
    let expired = false;
    await page.route('**/v1/balances', (route) =>
      route.fulfill(
        expired
          ? { status: 401, body: '' }
          : {
              json: {
                balances: [
                  {
                    available: { currency: 'USD', amount: '10' },
                    reserved: { currency: 'USD', amount: '0' },
                  },
                ],
              },
            },
      ),
    );
    const payment = {
      id: 'private-payment',
      type: 'PAYMENT_TYPE_DEPOSIT',
      status: 'PAYMENT_STATUS_COMPLETED',
      createdAt: '2026-09-27T00:00:00Z',
      amount: { currency: 'USDT', amount: '10' },
    };
    await page.route('**/v1/payments?*', (route) => route.fulfill({ json: { payments: [payment] } }));
    await page.route('**/v1/payments/private-payment', (route) => route.fulfill({ json: { payment } }));
    await page.goto('/cabinet');
    await expect(page.getByText('+10 USDT', { exact: true })).toBeVisible();
    await page.getByRole('button', { name: /10 USDT/ }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await context.clearCookies({ name: 'atlas_session' });
    expired = true;
    await expect(page).toHaveURL(/\/account$/, { timeout: 20000 });
    await expect(page.getByRole('button', { name: 'Войти', exact: true })).toBeVisible();
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await expect(page.getByText('+10 USDT', { exact: true })).toHaveCount(0);
    await page.screenshot({ path: `artifacts/screenshots/account-expired-${width}.png`, fullPage: true });
  });
}
