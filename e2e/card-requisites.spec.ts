import { mkdir } from 'node:fs/promises';
import { test, expect } from './fixtures/cabinet';
for (const width of [375, 1440]) {
  test(`explicit requisites reveal and reset at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 });
    await page.route('**/v1/cards/test-card', (route) =>
      route.fulfill({
        json: {
          card: {
            id: 'test-card',
            cardTypeId: 'travel',
            currency: 'USD',
            status: 'CARD_STATUS_ACTIVE',
            name: 'Для путешествий',
            balance: { currency: 'USD', amount: '128.4' },
            maskedNumber: '•••• TEST',
          },
          requisites: {
            number: '0000000000001234',
            securityCode: '000',
            expirationMonth: '09',
            expirationYear: '2030',
            holderName: 'TEST HOLDER',
            billingAddress: {
              countryCode: 'SG',
              addressLine1: 'TEST ADDRESS',
              city: 'Singapore',
              postalCode: '000000',
            },
          },
        },
      }),
    );
    await page.route('**/v1/cards/tariff', (route) =>
      route.fulfill({
        json: {
          tariffId: 'cards',
          currency: 'USD',
          categories: {
            travel: {
              name: 'Travel',
              palette: { background: '#cbf31a', foreground: '#1c2600' },
              fees: { issue_price: { fixed: '20' }, issue_commission: { fixed: '5' } },
            },
          },
        },
      }),
    );
    await page.addInitScript(() => {
      Object.defineProperty(navigator, 'clipboard', {
        configurable: true,
        value: {
          writeText: async (value: string) => {
            (window as typeof window & { copiedRequisite?: string }).copiedRequisite = value;
          },
        },
      });
    });
    await page.goto('/cabinet/card?id=test-card');
    const reveal = page.getByRole('button', { name: 'Реквизиты карты', exact: true });
    await expect(reveal).toBeVisible();
    await expect(page.getByText('0000 0000 0000 1234', { exact: true })).toHaveCount(0);
    await expect(page.getByText('Для путешествий', { exact: true })).toBeVisible();
    const face = page.locator('[data-presentation="owned"]');
    const frontSize = await face.boundingBox();
    await mkdir('artifacts/screenshots', { recursive: true });
    await page.screenshot({ path: `artifacts/screenshots/card-front-${width}.png`, fullPage: true });
    await reveal.focus();
    await page.keyboard.press('Enter');
    await expect(page.getByText('0000 0000 0000 1234', { exact: true })).toBeVisible();
    await expect(page.getByText('000', { exact: true })).toBeVisible();
    await expect(page.getByText('TEST HOLDER', { exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Обновить реквизиты' })).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Повторить', exact: true })).toHaveCount(0);
    await expect
      .poll(async () => {
        const backSize = await page
          .getByRole('button', { name: 'Скрыть реквизиты', exact: true })
          .evaluate((button) => button.closest('[class*="requisites"]')!.getBoundingClientRect().height);
        return Math.abs(backSize - frontSize!.height);
      })
      .toBeLessThan(1);
    for (const [label, value] of [
      ['Скопировать номер карты', '0000000000001234'],
      ['Скопировать имя держателя', 'TEST HOLDER'],
      ['Скопировать адрес', 'TEST ADDRESS'],
      ['Скопировать город', 'Singapore'],
      ['Скопировать почтовый индекс', '000000'],
      ['Скопировать страну', 'Singapore'],
      ['Скопировать срок действия', '09/30'],
      ['Скопировать CVV', '000'],
    ]) {
      await page.getByRole('button', { name: label, exact: true }).focus();
      await page.keyboard.press('Enter');
      await expect
        .poll(() =>
          page.evaluate(() => (window as typeof window & { copiedRequisite?: string }).copiedRequisite),
        )
        .toBe(value);
    }
    await mkdir('artifacts/screenshots', { recursive: true });
    await page.screenshot({
      path: `artifacts/screenshots/card-requisites-${width}.png`,
      fullPage: true,
      animations: 'disabled',
    });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.getByRole('button', { name: 'Скрыть реквизиты', exact: true }).click();
    await expect(page.getByText('0000 0000 0000 1234', { exact: true })).toHaveCount(0);
    await expect(reveal).toBeFocused();
    await reveal.click();
    await expect(page.getByText('TEST HOLDER', { exact: true })).toBeVisible();
    await page.reload();
    await expect(reveal).toHaveAttribute('aria-pressed', 'false');
    await expect(page.getByText('0000 0000 0000 1234', { exact: true })).toHaveCount(0);
  });
}
