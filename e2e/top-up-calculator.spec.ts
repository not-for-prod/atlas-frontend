import { mkdir } from 'node:fs/promises';
import { expect, test } from './fixtures/cabinet';

for (const width of [375, 1440]) {
  test(`top-up calculator validates limits and fee-inclusive balance at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 });
    let quotes = 0;
    let balanceUnavailable = false;
    await page.route('**/v1/balances', (route) =>
      balanceUnavailable
        ? route.fulfill({ status: 503, body: 'unavailable' })
        : route.fulfill({
            json: {
              balances: [
                {
                  available: { amount: '11', currency: 'USD' },
                  reserved: { amount: '9999.99', currency: 'USD' },
                },
              ],
            },
          }),
    );
    await page.route('**/v1/cards/stored-card', (route) =>
      route.fulfill({
        json: {
          card: {
            id: 'stored-card',
            cardTypeId: 'CATEGORY_TRAVEL',
            currency: 'USD',
            status: 'CARD_STATUS_ACTIVE',
          },
        },
      }),
    );
    await page.route('**/v1/cards/stored-card/top-ups/current', (route) => route.fulfill({ json: {} }));
    await page.route('**/v1/cards/stored-card/top-ups/quote', async (route) => {
      quotes++;
      const { amount } = route.request().postDataJSON();
      await route.fulfill({ json: { amount, fee: { amount: '1', currency: 'USD' } } });
    });
    let submissions = 0;
    await page.route('**/v1/cards/stored-card/top-ups', (route) => {
      submissions++;
      return route.fulfill({ status: 503, body: 'unknown' });
    });
    await page.goto('/cabinet/card?id=stored-card');
    const opener = page.getByRole('button', { name: 'Пополнить', exact: true });
    await opener.focus();
    await page.keyboard.press('Enter');
    const modal = page.getByRole('dialog');
    const input = modal.getByLabel('Сумма пополнения');
    const submit = modal.getByRole('button', { name: 'Пополнить карту' });
    await expect(modal.getByText('Доступно на балансе: 11,00 $')).toBeVisible();
    await expect(modal.getByText(/Минимальное пополнение/)).toBeVisible();
    await expect(submit).toBeDisabled();
    await input.fill('9.99');
    await expect(modal.getByText('Минимальная сумма пополнения — 10,00 $.')).toBeVisible();
    await expect(submit).toBeDisabled();
    await input.press('Enter');
    await input.fill('1000.01');
    await expect(modal.getByText('Максимальная сумма пополнения — 1\u00a0000,00 $.')).toBeVisible();
    await expect(submit).toBeDisabled();
    expect(quotes).toBe(0);
    await input.fill('10.001');
    await expect(
      modal.getByText('Недостаточно средств на балансе. Уменьшите сумму или пополните баланс.'),
    ).toBeVisible();
    await expect(submit).toBeDisabled();
    await input.fill('10,00');
    await expect(submit).toBeEnabled();
    await expect(modal.getByText('10,00 $', { exact: true })).toBeVisible();
    await expect(modal.getByText('1,00 $', { exact: true })).toBeVisible();
    await expect(modal.getByText('11,00 $', { exact: true })).toBeVisible();
    await expect(modal).toHaveCSS('opacity', '1');
    await mkdir('artifacts/screenshots', { recursive: true });
    await page.screenshot({ path: `artifacts/screenshots/top-up-calculator-${width}.png`, fullPage: true });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await input.fill('10.01');
    await expect(
      modal.getByText('Недостаточно средств на балансе. Уменьшите сумму или пополните баланс.'),
    ).toBeVisible();
    await expect(submit).toBeDisabled();
    await input.press('Enter');
    expect(submissions).toBe(0);
    await input.fill('');
    await expect(submit).toBeDisabled();
    await expect(modal.getByText('10,01 $', { exact: true })).toHaveCount(0);
    await page.keyboard.press('Escape');
    await expect(modal).toHaveCount(0);
    await expect(opener).toBeFocused();
    balanceUnavailable = true;
    await opener.click();
    await expect(
      modal.getByText('Не удалось проверить лимиты и баланс. Обновите данные перед пополнением.'),
    ).toBeVisible();
    await input.fill('10');
    await expect(submit).toBeDisabled();
    balanceUnavailable = false;
    await modal.getByRole('button', { name: 'Обновить', exact: true }).click();
    await expect(submit).toBeEnabled();
  });
}
