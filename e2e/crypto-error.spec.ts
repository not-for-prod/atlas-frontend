import { expect, test } from './fixtures/cabinet';
for (const width of [375, 1440]) {
  test(`crypto unavailable error is visible and keyboard actionable at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 });
    await page.route('**/v1/payments/crypto-deposit-addresses', (route) =>
      route.fulfill({
        status: 503,
        contentType: 'application/json',
        body: JSON.stringify({ code: 14, message: 'unavailable' }),
      }),
    );
    await page.goto('/cabinet/deposit');
    await page.getByLabel('Сколько хотите получить на баланс, USD').fill('100');
    await page.getByRole('button', { name: 'Посмотреть способы оплаты' }).click();
    const generate = page.getByRole('button', { name: /Получить адрес/ });
    await generate.focus();
    await page.keyboard.press('Enter');
    const alert = page.getByRole('alert', { name: 'Не удалось получить адрес' });
    await expect(alert).toContainText('Криптопополнение временно недоступно. Попробуйте позже.');
    const retry = alert.getByRole('button', { name: 'Повторить попытку' });
    await retry.focus();
    await expect(retry).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(alert).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.screenshot({
      path: `artifacts/screenshots/crypto-error-${width}.png`,
      fullPage: true,
      animations: 'disabled',
    });
  });
}
