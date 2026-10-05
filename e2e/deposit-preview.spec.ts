import { expect, test } from './fixtures/cabinet';
for (const width of [375, 1440]) {
  test(`amount-first payment preview and focus restoration at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto('/cabinet');
    const trigger = page.getByRole('button', { name: 'Пополнить баланс', exact: true });
    await trigger.focus();
    await page.keyboard.press('Enter');
    const dialog = page.getByRole('dialog');
    const input = dialog.getByLabel('Сколько хотите получить на баланс, USD');
    await expect(input).toBeFocused();
    await expect(dialog.getByText('USDT', { exact: true })).toHaveCount(0);
    await input.fill('0');
    await input.press('Enter');
    await expect(
      dialog.getByText('Введите сумму больше нуля, не более двух знаков после запятой.'),
    ).toBeVisible();
    await input.fill('100,25');
    await input.press('Enter');
    await expect(dialog.getByRole('heading', { name: 'Предварительный расчёт платежа' })).toBeFocused();
    await expect(dialog.getByText('100,25 $', { exact: true })).toBeVisible();
    await expect(dialog.getByText('100,25 USDT', { exact: true })).toBeVisible();
    await expect(dialog.getByText('Комиссия Atlas')).toBeVisible();
    await expect(dialog.getByText('0,00 $', { exact: true })).toBeVisible();
    await expect(dialog.getByRole('button', { name: /СБП/ })).toHaveCount(0);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.screenshot({
      path: `artifacts/screenshots/deposit-preview-${width}.png`,
      fullPage: true,
      animations: 'disabled',
    });
    await dialog.getByRole('button', { name: 'Изменить сумму' }).click();
    await expect(input).toHaveValue('100,25');
    await expect(input).toBeFocused();
    await page.screenshot({
      path: `artifacts/screenshots/deposit-amount-${width}.png`,
      fullPage: true,
      animations: 'disabled',
    });
    await page.keyboard.press('Escape');
    await expect(dialog).toHaveCount(0);
    await expect(trigger).toBeFocused();
  });
}
